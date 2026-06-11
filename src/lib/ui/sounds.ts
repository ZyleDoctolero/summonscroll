// Sound design — synthesized via Web Audio API.
// No asset files needed. Each sound is a small composition of sine/triangle
// waves with an envelope (attack → release). Tuned for "weight without
// annoyance" — Emil's principle applies to audio too.
//
// All sounds respect the user's `prefers-reduced-motion` OS setting AND a
// localStorage flag `ss-mute`, so users can silence the whole game.

let ctx: AudioContext | null = null;
let muted: boolean | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      // Lazy-init to comply with browsers requiring user-gesture-first.
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

function isMuted(): boolean {
  if (muted !== null) return muted;
  if (typeof window === "undefined") return true;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  muted = window.localStorage?.getItem("ss-mute") === "1";
  return muted ?? false;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage?.setItem("ss-mute", value ? "1" : "0");
  }
}

// ─── Primitive: play a single note with an envelope ─────────────────────────

function note(opts: {
  freq: number;            // Hz
  duration: number;        // seconds
  type?: OscillatorType;   // sine / triangle / square / sawtooth
  gain?: number;           // 0..1
  attack?: number;         // seconds
  release?: number;        // seconds
  delay?: number;          // seconds (offset from now)
}) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});

  const start = ac.currentTime + (opts.delay ?? 0);
  const osc = ac.createOscillator();
  const gainNode = ac.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.value = opts.freq;

  const peak = opts.gain ?? 0.12;
  const attack = opts.attack ?? 0.005;
  const release = opts.release ?? 0.08;

  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(peak, start + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration + release);

  osc.connect(gainNode);
  gainNode.connect(ac.destination);
  osc.start(start);
  osc.stop(start + opts.duration + release + 0.02);
}

// ─── Library of game sounds ────────────────────────────────────────────────

export const sounds = {
  // Soft chime when the Cascade Card appears or a small reward lands
  chime() {
    note({ freq: 659.25, duration: 0.12, type: "sine", gain: 0.08, release: 0.18 });        // E5
    note({ freq: 987.77, duration: 0.16, type: "sine", gain: 0.05, release: 0.22, delay: 0.05 }); // B5
  },

  // Click on task tick or button — short, dry
  click() {
    note({ freq: 880, duration: 0.04, type: "triangle", gain: 0.06, release: 0.04 });
  },

  // Deep drum for big commitments (Trial confirm, Promotion ritual begin)
  drum() {
    note({ freq: 70, duration: 0.18, type: "sine", gain: 0.18, attack: 0.001, release: 0.25 });
    note({ freq: 110, duration: 0.12, type: "triangle", gain: 0.06, release: 0.18, delay: 0.02 });
  },

  // Bright bell for awakenings or Reflection Pull granted
  bell() {
    note({ freq: 783.99, duration: 0.4, type: "sine", gain: 0.12, attack: 0.005, release: 0.7 });
    note({ freq: 1567.98, duration: 0.4, type: "sine", gain: 0.04, attack: 0.005, release: 0.6, delay: 0.02 });
  },

  // Ascending chime for level-up / promotion completion
  ascend() {
    const base = 523.25; // C5
    [0, 4, 7, 12].forEach((semi, i) => {
      note({
        freq: base * Math.pow(2, semi / 12),
        duration: 0.12,
        type: "sine",
        gain: 0.07,
        release: 0.16,
        delay: i * 0.06,
      });
    });
  },

  // Low ominous tone — used for defeat or fallen monster
  toll() {
    note({ freq: 130, duration: 0.6, type: "sine", gain: 0.14, attack: 0.05, release: 0.9 });
    note({ freq: 87, duration: 0.6, type: "triangle", gain: 0.05, attack: 0.05, release: 0.9 });
  },
};
