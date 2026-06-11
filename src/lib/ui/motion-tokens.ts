// Motion tokens — Emil Kowalski's principles encoded as constants.
// The point: every animation in the app picks from this list. No new curves,
// no new durations introduced ad-hoc. The result is a single felt motion grammar.
//
// Reference: emilkowalski.com — "Designing Better Transitions"

import type { Transition } from "motion/react";

// ─── Duration budget ────────────────────────────────────────────────────────
// Nothing in a UI should ever take longer than 600ms — past that, it feels slow.
// Most app motion lives in the 120-300ms range.

export const dur = {
  instant: 0.08,    // status flicks, hover state changes
  fast:    0.16,    // button presses, micro feedback
  normal:  0.24,    // most modals, panel reveals, item appears
  measured: 0.36,   // ritual moments, hero transitions
  weighty: 0.48,    // page-level transitions, big reveals
  // Anything longer than this is animation-for-its-own-sake. Avoid.
} as const;

// ─── Easing curves ──────────────────────────────────────────────────────────
// Emil's rule: NEVER linear for spatial motion. Linear feels mechanical.
// • Entrances: ease-out (decelerate into rest — "thing arrived")
// • Exits: ease-in (accelerate away — "thing left")
// • Both ways: cubic-bezier with overshoot for delight

export const ease = {
  // Standard out — items appearing
  out:     [0.2, 0.65, 0.3, 1] as [number, number, number, number],
  // Standard in — items leaving
  in:      [0.4, 0, 0.65, 0.35] as [number, number, number, number],
  // Both — symmetric movement
  inOut:   [0.5, 0, 0.5, 1] as [number, number, number, number],
  // Slight overshoot at end — adds "weight" to things landing
  weighty: [0.32, 0.72, 0, 1] as [number, number, number, number],
} as const;

// ─── Pre-baked transitions for common cases ─────────────────────────────────

export const trans: Record<string, Transition> = {
  // Modal/panel reveal
  modalIn:  { duration: dur.normal, ease: ease.out },
  modalOut: { duration: dur.fast,   ease: ease.in },

  // Cascade card slide-up
  cascadeIn:  { duration: dur.measured, ease: ease.weighty },
  cascadeOut: { duration: dur.normal,  ease: ease.in },

  // Number tick — should feel snappy, not floating
  numberTick: { duration: dur.normal, ease: ease.out },

  // Item appears in a list
  itemIn: { duration: dur.fast, ease: ease.out },

  // Ritual progress — long, deliberate
  ritual: { duration: dur.weighty, ease: ease.inOut },

  // Spring physics for buttons + interactive elements
  springy: { type: "spring", stiffness: 380, damping: 32, mass: 0.6 },
};

// ─── Stagger helpers ────────────────────────────────────────────────────────

export function stagger(count: number, perItem = 0.04, base = 0) {
  return Array.from({ length: count }, (_, i) => base + i * perItem);
}

// ─── A11y: respect prefers-reduced-motion ────────────────────────────────────

export function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
