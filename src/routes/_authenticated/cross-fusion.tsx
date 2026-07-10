import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { getMyProfile, listMyMonsters } from "@/lib/game/supabase-api";
import { Icon } from "@/components/ui/Icon";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";

export const Route = createFileRoute("/_authenticated/cross-fusion")({
  component: CrossFusionPage,
});

type SlimMonster = {
  id: string;
  level: number;
  star_level?: number;
  current_star?: number;
  bond_percent: number;
  monster: {
    name: string;
    element: string;
    realm: string;
    rarity: string;
    art_url?: string | null;
  };
};

const REALM_COLORS: Record<string, string> = {
  verdant: "#3ed97a",
  infernal: "#e85d3a",
  abyssal: "#9b6dff",
  celestial: "#ffe066",
  tidal: "#38b8f5",
  elder: "#c44f6f",
  blight: "#6dc4c4",
  myth: "#d4a030",
  void: "#9b6dff",
  stellar: "#6db8e8",
  primal: "#d4843a",
  digital: "#38b8f5",
};

function getRealmColor(realm: string): string {
  return REALM_COLORS[realm?.toLowerCase()] ?? "#c9a84c";
}

function CrossFusionPage() {
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["myMonsters"], queryFn: listMyMonsters });
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [catalystId, setCatalystId] = useState<string | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<"primary" | "catalyst" | null>(null);

  if (profileQ.isLoading || monstersQ.isLoading) return <LoadingScreen />;
  if (!profileQ.data?.profile) return <EmptyState icon="alert" title="Not authenticated" />;

  const monsters = (monstersQ.data?.userMonsters ?? []) as SlimMonster[];
  const primary = monsters.find((m) => m.id === primaryId);
  const catalyst = monsters.find((m) => m.id === catalystId);

  const canFuse =
    primary &&
    catalyst &&
    primary.monster.realm?.toLowerCase() !== catalyst.monster.realm?.toLowerCase() &&
    (primary.star_level ?? primary.current_star ?? 1) >= 5 &&
    (catalyst.star_level ?? catalyst.current_star ?? 1) >= 5;

  const primaryRealm = primary?.monster.realm ?? "unknown";
  const catalystRealm = catalyst?.monster.realm ?? "unknown";
  const sameRealm =
    primary && catalyst && primaryRealm.toLowerCase() === catalystRealm.toLowerCase();

  return (
    <AppShell profile={profileQ.data.profile}>
      <AtmosphereBackdrop realm="void" />
      <div className="p-6 md:p-10 max-w-5xl mx-auto relative z-10 min-h-screen flex flex-col items-center">
        <h1
          className="text-3xl font-bold mb-2 uppercase"
          style={{ fontFamily: "var(--ss-font-pixel)", color: "#9b6dff", letterSpacing: "0.08em" }}
        >
          CROSS-REALM FUSION
        </h1>
        <p className="text-sm mb-10 max-w-lg text-center" style={{ color: "var(--ink-secondary)" }}>
          Merge two ★5+ souls from <b style={{ color: "#9b6dff" }}>different realms</b> to birth a
          hybrid entity with dual-realm affinities and a unique Cross-Realm passive skill.
        </p>

        {/* Fusion Slots */}
        <div className="flex items-center justify-center gap-3 md:gap-12 mb-10">
          {/* Primary Slot */}
          <div className="flex flex-col items-center">
            <p
              className="text-[10px] uppercase font-bold mb-2"
              style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-secondary)" }}
            >
              PRIMARY
            </p>
            {primary ? (
              <button
                onClick={() => setSelectingSlot("primary")}
                className="w-36 h-44 border-2 p-2 flex flex-col items-center justify-center relative"
                style={{
                  borderRadius: 0,
                  borderColor: getRealmColor(primaryRealm),
                  background: `${getRealmColor(primaryRealm)}15`,
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
                }}
              >
                <div
                  className="w-20 h-20 mb-2 overflow-hidden flex items-center justify-center"
                  style={{ borderRadius: 0, border: `1px solid ${getRealmColor(primaryRealm)}40` }}
                >
                  <img
                    src={
                      primary.monster.art_url ??
                      `/sprites/monsters/${primary.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                    }
                    className="w-full h-full object-cover"
                    style={{ imageRendering: "pixelated" }}
                    alt={primary.monster.name}
                    onError={(e) => {
                      e.currentTarget.src = "/monsters/placeholder.png";
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold truncate w-full text-center"
                  style={{ fontFamily: "var(--ss-font-pixel)", color: getRealmColor(primaryRealm) }}
                >
                  {primary.monster.name}
                </span>
                <span
                  className="text-[9px] mt-0.5"
                  style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-tertiary)" }}
                >
                  ★{primary.star_level ?? primary.current_star ?? 1} · {primaryRealm}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setSelectingSlot("primary")}
                className="w-36 h-44 border-2 border-dashed flex flex-col items-center justify-center"
                style={{
                  borderRadius: 0,
                  borderColor: "rgba(155,109,255,0.4)",
                  color: "#9b6dff",
                  fontFamily: "var(--ss-font-pixel)",
                }}
              >
                <span className="text-4xl mb-2">+</span>
                <span className="text-[10px] font-bold">SELECT PRIMARY</span>
              </button>
            )}
          </div>

          {/* Fusion Arrow */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-12 h-12 flex items-center justify-center border-2"
              style={{
                borderRadius: 0,
                borderColor: canFuse ? "#9b6dff" : "rgba(139,115,85,0.3)",
                background: canFuse ? "rgba(155,109,255,0.15)" : "rgba(0,0,0,0.1)",
                boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
              }}
            >
              <span style={{ fontSize: 20, color: canFuse ? "#9b6dff" : "var(--ink-tertiary)" }}>
                ⚗
              </span>
            </div>
            {sameRealm && (
              <span
                className="text-[9px] font-bold px-2 py-0.5"
                style={{
                  fontFamily: "var(--ss-font-pixel)",
                  borderRadius: 0,
                  background: "rgba(232,93,58,0.15)",
                  color: "var(--danger)",
                  border: "1px solid rgba(232,93,58,0.3)",
                }}
              >
                SAME REALM!
              </span>
            )}
          </div>

          {/* Catalyst Slot */}
          <div className="flex flex-col items-center">
            <p
              className="text-[10px] uppercase font-bold mb-2"
              style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-secondary)" }}
            >
              CATALYST
            </p>
            {catalyst ? (
              <button
                onClick={() => setSelectingSlot("catalyst")}
                className="w-36 h-44 border-2 p-2 flex flex-col items-center justify-center relative"
                style={{
                  borderRadius: 0,
                  borderColor: getRealmColor(catalystRealm),
                  background: `${getRealmColor(catalystRealm)}15`,
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
                }}
              >
                <div
                  className="w-20 h-20 mb-2 overflow-hidden flex items-center justify-center"
                  style={{ borderRadius: 0, border: `1px solid ${getRealmColor(catalystRealm)}40` }}
                >
                  <img
                    src={
                      catalyst.monster.art_url ??
                      `/sprites/monsters/${catalyst.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                    }
                    className="w-full h-full object-cover"
                    style={{ imageRendering: "pixelated" }}
                    alt={catalyst.monster.name}
                    onError={(e) => {
                      e.currentTarget.src = "/monsters/placeholder.png";
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold truncate w-full text-center"
                  style={{
                    fontFamily: "var(--ss-font-pixel)",
                    color: getRealmColor(catalystRealm),
                  }}
                >
                  {catalyst.monster.name}
                </span>
                <span
                  className="text-[9px] mt-0.5"
                  style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-tertiary)" }}
                >
                  ★{catalyst.star_level ?? catalyst.current_star ?? 1} · {catalystRealm}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setSelectingSlot("catalyst")}
                className="w-36 h-44 border-2 border-dashed flex flex-col items-center justify-center"
                style={{
                  borderRadius: 0,
                  borderColor: "rgba(155,109,255,0.4)",
                  color: "#9b6dff",
                  fontFamily: "var(--ss-font-pixel)",
                }}
              >
                <span className="text-4xl mb-2">+</span>
                <span className="text-[10px] font-bold">SELECT CATALYST</span>
              </button>
            )}
          </div>
        </div>

        {/* Fusion Result Preview */}
        {canFuse && (
          <div
            className="w-full max-w-md p-4 mb-6 border"
            style={{
              borderRadius: 0,
              borderColor: "rgba(155,109,255,0.3)",
              background: "rgba(155,109,255,0.06)",
              boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
            }}
          >
            <p
              className="text-[10px] uppercase font-bold mb-2"
              style={{ fontFamily: "var(--ss-font-pixel)", color: "#9b6dff" }}
            >
              FUSION RESULT PREVIEW
            </p>
            <div className="space-y-1 text-[11px]" style={{ color: "var(--ink-secondary)" }}>
              <p>
                <span style={{ color: getRealmColor(primaryRealm) }}>■</span> {primaryRealm} ×{" "}
                <span style={{ color: getRealmColor(catalystRealm) }}>■</span> {catalystRealm}
              </p>
              <p>→ Dual-Realm affinity unlocked</p>
              <p>→ Cross-Realm passive: Planar Rift Walker</p>
              <p>→ Primary retains all skills, gains catalyst realm aura</p>
            </div>
          </div>
        )}

        {/* Fuse Button */}
        <button
          disabled={!canFuse}
          // the disabled state doubles as the page's instruction — keep it legible
          className="px-8 py-3 font-bold uppercase transition-all"
          style={{
            fontFamily: "var(--ss-font-pixel)",
            fontSize: 12,
            borderRadius: 0,
            background: canFuse
              ? "linear-gradient(135deg, #9b6dff, #6db8e8)"
              : "rgba(139,115,85,0.1)",
            color: canFuse ? "var(--ink-primary)" : "var(--ink-secondary)",
            border: `2px solid ${canFuse ? "#9b6dff" : "rgba(139,115,85,0.2)"}`,
            boxShadow: canFuse ? "4px 4px 0 rgba(0,0,0,0.4)" : "none",
            cursor: canFuse ? "pointer" : "default",
          }}
        >
          {canFuse ? "⚗ INITIATE CROSS-REALM FUSION" : "SELECT TWO DIFFERENT-REALM ★5+ SOULS"}
        </button>

        {/* Selection Panel */}
        {selectingSlot && (
          <div
            className="w-full max-w-2xl mt-8 p-4 border"
            style={{
              borderRadius: 0,
              borderColor: "rgba(155,109,255,0.2)",
              background: "rgba(0,0,0,0.2)",
              boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[10px] uppercase font-bold"
                style={{ fontFamily: "var(--ss-font-pixel)", color: "#9b6dff" }}
              >
                SELECT {selectingSlot.toUpperCase()} SOUL (★5+)
              </p>
              <button
                onClick={() => setSelectingSlot(null)}
                className="text-[10px] px-2 py-1 border"
                style={{
                  fontFamily: "var(--ss-font-pixel)",
                  borderRadius: 0,
                  borderColor: "rgba(139,115,85,0.3)",
                  color: "var(--ink-secondary)",
                }}
              >
                CANCEL
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {monsters
                .filter((m) => {
                  const star = m.star_level ?? m.current_star ?? 1;
                  if (star < 5) return false;
                  if (selectingSlot === "primary" && m.id === catalystId) return false;
                  if (selectingSlot === "catalyst" && m.id === primaryId) return false;
                  return true;
                })
                .map((m) => {
                  const realm = m.monster.realm ?? "unknown";
                  const isSelected =
                    (selectingSlot === "primary" && m.id === primaryId) ||
                    (selectingSlot === "catalyst" && m.id === catalystId);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (selectingSlot === "primary") setPrimaryId(m.id);
                        else setCatalystId(m.id);
                        setSelectingSlot(null);
                      }}
                      className={`p-1.5 border flex flex-col items-center ${isSelected ? "border-[#9b6dff]" : "border-transparent"}`}
                      style={{
                        borderRadius: 0,
                        background: isSelected ? "rgba(155,109,255,0.1)" : "transparent",
                        boxShadow: isSelected ? "2px 2px 0 rgba(155,109,255,0.3)" : undefined,
                      }}
                    >
                      <div
                        className="w-14 h-14 overflow-hidden mb-1 flex items-center justify-center"
                        style={{
                          borderRadius: 0,
                          border: `1px solid ${getRealmColor(realm)}40`,
                        }}
                      >
                        <img
                          src={
                            m.monster.art_url ??
                            `/sprites/monsters/${m.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                          }
                          className="w-full h-full object-cover"
                          style={{ imageRendering: "pixelated" }}
                          alt={m.monster.name}
                          onError={(e) => {
                            e.currentTarget.src = "/monsters/placeholder.png";
                          }}
                        />
                      </div>
                      <span
                        className="text-[8px] truncate w-full text-center font-bold"
                        style={{ fontFamily: "var(--ss-font-pixel)", color: getRealmColor(realm) }}
                      >
                        {m.monster.name}
                      </span>
                    </button>
                  );
                })}
              {monsters.filter((m) => (m.star_level ?? m.current_star ?? 1) >= 5).length === 0 && (
                <p
                  className="col-span-full text-center py-6 text-[10px]"
                  style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-tertiary)" }}
                >
                  NO ★5+ SOULS AVAILABLE
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div
          className="w-full max-w-md mt-8 p-4 border"
          style={{
            borderRadius: 0,
            borderColor: "rgba(155,109,255,0.15)",
            background: "rgba(155,109,255,0.03)",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
          }}
        >
          <p
            className="text-[10px] uppercase font-bold mb-2"
            style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--violet-ink)" }}
          >
            HOW CROSS-REALM FUSION WORKS
          </p>
          <ul className="space-y-1.5 text-[11px]" style={{ color: "var(--ink-secondary)" }}>
            <li>• Both souls must be ★5 or higher</li>
            <li>
              • Souls must originate from <b>different realms</b>
            </li>
            <li>• The catalyst soul is consumed in the process</li>
            <li>• Primary soul gains dual-realm affinity + Cross-Realm passive</li>
            <li>• Cross-Realm passives stack with Heritage Traits</li>
            <li>• Each soul can only undergo Cross-Realm Fusion once</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
