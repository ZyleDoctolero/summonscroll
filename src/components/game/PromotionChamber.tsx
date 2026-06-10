import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { checkPromotionEligibility, promoteMonster } from "@/lib/game/supabase-api";

type Props = {
  userMonsterId: string;
  monsterName: string;
  onClose: () => void;
};

export function PromotionChamber({ userMonsterId, monsterName, onClose }: Props) {
  const qc = useQueryClient();
  const [stage, setStage] = useState<"check" | "ritual" | "done">("check");
  const [ritualAt, setRitualAt] = useState(0);

  const checkQ = useQuery({
    queryKey: ["promotion-check", userMonsterId],
    queryFn: () => checkPromotionEligibility(userMonsterId),
  });

  const promoteMut = useMutation({
    mutationFn: () => promoteMonster(userMonsterId),
    onSuccess: (res) => {
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 } });
      toast.success(`Promoted to ${res.to}★!`);
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setStage("done");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setStage("check");
    },
  });

  // 3-second ritual stage that consumes inputs once user confirms
  useEffect(() => {
    if (stage !== "ritual") return;
    const start = Date.now();
    setRitualAt(0);
    const id = setInterval(() => setRitualAt(Date.now() - start), 80);
    const done = setTimeout(() => {
      clearInterval(id);
      promoteMut.mutate();
    }, 3000);
    return () => { clearInterval(id); clearTimeout(done); };
  }, [stage]);

  if (checkQ.isLoading) {
    return <Modal onClose={onClose}><p className="text-center" style={{ color: "#A09D96" }}>Reading the soul…</p></Modal>;
  }
  if (!checkQ.data) return null;

  const c = checkQ.data;
  const req = c.requirement;
  const reqStoneName = req.stones.name;
  const stoneOk = c.have.stones >= req.stones.qty;
  const bondOk = c.have.bond >= req.bondRequired;
  const levelOk = c.have.level >= req.levelRequired;

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
        The Promotion Chamber
      </h2>
      <p className="text-xs text-center mb-4" style={{ color: "#A09D96" }}>
        Bring {monsterName} to {req.newStarLevel}★
      </p>

      {/* Ritual circle */}
      <div className="relative flex justify-center mb-6">
        <div
          className="w-32 h-32 rounded-full border-2 transition-all"
          style={{
            borderColor: stage === "ritual" ? "#FFD54F" : "rgba(255,213,79,0.3)",
            background: stage === "ritual" ? "radial-gradient(circle, rgba(255,213,79,0.3), transparent 70%)" : "transparent",
            boxShadow: stage === "ritual" ? "0 0 48px rgba(255,213,79,0.5)" : undefined,
            animation: stage === "ritual" ? "pulse 1.5s ease-in-out infinite" : undefined,
          }}
        >
          <div className="absolute inset-0 grid place-items-center text-5xl">👾</div>
        </div>
      </div>

      {stage === "check" && (
        <>
          {/* Requirements */}
          <div className="rounded-lg p-4 mb-4 space-y-2" style={{ background: "rgba(0,0,0,0.3)" }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#A09D96" }}>Requirements</p>
            <ReqRow ok={stoneOk}>
              <span>🪨 {reqStoneName}</span>
              <span className="font-mono">{c.have.stones} / {req.stones.qty}</span>
            </ReqRow>
            {req.materials.map((mat) => {
              const have = c.have.materials[mat.name] ?? 0;
              const ok = have >= mat.qty;
              return (
                <ReqRow key={mat.name} ok={ok}>
                  <span>✨ {mat.name}</span>
                  <span className="font-mono">{have} / {mat.qty}</span>
                </ReqRow>
              );
            })}
            <ReqRow ok={bondOk}>
              <span>💖 Bond</span>
              <span className="font-mono">{Math.round(c.have.bond)}% / {req.bondRequired}%</span>
            </ReqRow>
            <ReqRow ok={levelOk}>
              <span>⚜ Level</span>
              <span className="font-mono">{c.have.level} / {req.levelRequired}</span>
            </ReqRow>
          </div>

          {req.unlocks && (
            <p className="text-xs text-center mb-4" style={{ color: "#FFD54F" }}>
              Unlocks on success: <span style={{ fontStyle: "italic" }}>{req.unlocks}</span>
            </p>
          )}

          {!c.canPromote && (
            <p className="text-xs text-center mb-4" style={{ color: "#E05252" }}>{c.reason}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-md text-xs uppercase tracking-widest font-bold"
              style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}
            >
              Cancel
            </button>
            <button
              onClick={() => setStage("ritual")}
              disabled={!c.canPromote}
              className="flex-[2] py-2.5 rounded-md text-xs uppercase tracking-widest font-bold disabled:opacity-40"
              style={{
                background: c.canPromote ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)",
                color: c.canPromote ? "#0C0E14" : "#6B6864",
                boxShadow: c.canPromote ? "0 0 24px rgba(255,213,79,0.3)" : "none",
              }}
            >
              Begin Ritual
            </button>
          </div>
        </>
      )}

      {stage === "ritual" && (
        <>
          <p className="text-center text-sm mb-4" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
            The Chamber sings.
          </p>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.min(100, (ritualAt / 3000) * 100)}%`,
                background: "linear-gradient(90deg, #C89A3E, #FFD54F)",
              }}
            />
          </div>
        </>
      )}

      {stage === "done" && (
        <div className="text-center">
          <p className="text-3xl mb-2" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
            ★ Promoted ★
          </p>
          <p className="text-sm mb-4" style={{ color: "#A09D96" }}>
            {monsterName} now stands at <span style={{ color: "#FFD54F" }}>{req.newStarLevel}★</span>.
          </p>
          {req.unlocks && <p className="text-xs italic mb-4" style={{ color: "#FFD54F" }}>{req.unlocks}</p>}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-md text-xs uppercase tracking-widest font-bold"
            style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
          >
            Continue
          </button>
        </div>
      )}
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl p-6 border"
        style={{ background: "#1A1E2A", borderColor: "rgba(255,213,79,0.3)" }}
      >
        {children}
      </div>
    </div>
  );
}

function ReqRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      className="flex justify-between items-center text-xs px-2 py-1 rounded"
      style={{
        background: ok ? "rgba(95,173,65,0.08)" : "rgba(224,82,82,0.06)",
        color: ok ? "#5FAD41" : "#E05252",
      }}
    >
      {children}
      <span className="ml-2" style={{ color: ok ? "#5FAD41" : "#E05252" }}>{ok ? "✓" : "✗"}</span>
    </div>
  );
}
