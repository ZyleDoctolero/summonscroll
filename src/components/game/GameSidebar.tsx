import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setMuted } from "@/lib/ui/sounds";
import { MoreSheet } from "./MoreSheet";
import { Icon } from "@/components/ui/Icon";
import { MoreHorizontal, Volume2, VolumeX } from "lucide-react";

const NAV_DAILY = [
  { to: "/", label: "Hub", icon: "morning", weight: "primary" },
  { to: "/quests", label: "Quests", icon: "crown", weight: "primary" },
  { to: "/altar", label: "Altar", icon: "summon", weight: "primary" },
  { to: "/expeditions", label: "Expeditions", icon: "stamina", weight: "primary" },
] as const;

const NAV_WEEKLY = [
  { to: "/battle", label: "Battle", icon: "battle", weight: "secondary" },
  { to: "/compendium", label: "Compendium", icon: "tome", weight: "secondary" },
  { to: "/codex", label: "Codex", icon: "memorial", weight: "secondary" },
  { to: "/island", label: "Island", icon: "island", weight: "secondary" },
] as const;

const NAV_RARE = [
  { to: "/forge", label: "Forge", icon: "stone" },
  { to: "/trial", label: "Trial of Echoes", icon: "death" },
  { to: "/guild", label: "Guild", icon: "crown" },
  { to: "/fusion", label: "Fusion", icon: "sparkle" },
  { to: "/bazaar", label: "Shop", icon: "gold" },
] as const;

const NAV_BOTTOM = [{ to: "/profile", label: "Profile", icon: "bond" }] as const;

const CLASS_ICONS: Record<string, string> = {
  warrior: "battle",
  mage: "summon",
  healer: "hp",
  rogue: "crown",
  none: "",
};

export function GameSidebar({
  displayName,
  level,
  playerClass,
}: {
  displayName: string;
  level: number;
  playerClass?: string;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const qc = useQueryClient();
  const [mute, setMute] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage?.getItem("ss-mute") === "1";
  });
  const [moreOpen, setMoreOpen] = useState(false);

  const toggleMute = () => {
    const next = !mute;
    setMute(next);
    setMuted(next);
  };

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  const classIcon = CLASS_ICONS[playerClass ?? "none"] ?? "";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col h-full py-6 px-3 w-[260px] fixed left-0 top-0 border-r z-50 backdrop-blur-md"
        style={{ background: "rgba(5, 10, 18, 0.75)", borderColor: "rgba(0, 242, 255, 0.15)", boxShadow: "2px 0 20px rgba(0, 242, 255, 0.05)" }}
      >
        <div className="mb-6 px-3">
          <div
            className="font-bold mb-4 whitespace-nowrap relative"
            style={{
              color: "var(--cyan)",
              fontFamily: "var(--ss-font-display)",
              fontSize: "20px",
              letterSpacing: "0.05em",
              lineHeight: 1.1,
              textShadow: "0 0 10px rgba(0, 242, 255, 0.6), 0 0 20px rgba(0, 242, 255, 0.3)",
              textTransform: "uppercase"
            }}
          >
            SummonScroll
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full grid place-items-center font-bold ss-btn-d-primary">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--ink-primary)" }}>
                {displayName}
              </div>
              <div
                className="text-xs flex items-center gap-1 mt-0.5"
                style={{ color: "var(--ink-secondary)" }}
              >
                {classIcon && (
                  <Icon name={classIcon as any} size={12} color="var(--ink-secondary)" />
                )}
                <span>
                  Level {level}
                  {playerClass &&
                    playerClass !== "none" &&
                    ` . ${playerClass[0].toUpperCase() + playerClass.slice(1)}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV_DAILY.map((item) => (
            <NavLink key={item.to} item={item} path={path} weight="primary" />
          ))}
          <div className="h-px my-2" style={{ background: "var(--ss-border)" }} />
          {NAV_WEEKLY.map((item) => (
            <NavLink key={item.to} item={item} path={path} weight="secondary" />
          ))}
          <button onClick={() => setMoreOpen(true)} className="ss-nav-more">
            <MoreHorizontal size={16} />
            More
          </button>
          <div className="h-px my-2" style={{ background: "var(--ss-border)" }} />
          {NAV_BOTTOM.map((item) => (
            <NavLink key={item.to} item={item} path={path} weight="primary" />
          ))}
        </nav>

        <div className="mt-4 mx-2 flex gap-2">
          <button
            onClick={toggleMute}
            title={mute ? "Unmute" : "Mute"}
            aria-label={mute ? "Unmute" : "Mute"}
            className="px-3 py-2 text-base rounded-md border transition-colors hover:bg-white/5"
            style={{
              color: mute ? "var(--ink-tertiary)" : "var(--gold-bright)",
              borderColor: "var(--ss-border)",
            }}
          >
            {mute ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={signOut}
            className="flex-1 px-3 py-2 text-xs uppercase tracking-widest rounded-md border transition-colors hover:bg-white/5"
            style={{ color: "var(--ink-secondary)", borderColor: "var(--ss-border)" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t backdrop-blur-md"
        style={{ background: "rgba(8,8,13,0.95)", borderColor: "var(--ss-border)" }}
      >
        {NAV_DAILY.map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[44px] transition-colors"
              style={{ color: active ? "var(--gold-bright)" : "var(--ink-tertiary)" }}
            >
              <Icon name={item.icon as any} size={20} />
              <span className="text-[9px] uppercase tracking-wider font-semibold">
                {item.label}
              </span>
              {active && (
                <div
                  className="w-4 h-0.5 rounded-full mt-0.5"
                  style={{ background: "var(--gold-bright)" }}
                />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[44px] transition-colors"
          style={{ color: "var(--ink-secondary)" }}
        >
          <MoreHorizontal size={20} />
          <span className="text-[9px] uppercase tracking-wider font-semibold">More</span>
        </button>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}

function NavLink({
  item,
  path,
  weight = "primary",
}: {
  item: { to: string; label: string; icon: string };
  path: string;
  weight?: "primary" | "secondary";
}) {
  const active = path === item.to;
  const isPrimary = weight === "primary";

  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-3 rounded-md transition-all ${
        isPrimary ? "ss-nav-primary" : "ss-nav-secondary"
      } ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={item.icon as any} size={isPrimary ? 22 : 18} />
      <span className="uppercase tracking-wider font-semibold">{item.label}</span>
    </Link>
  );
}
