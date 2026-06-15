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
      {/* Desktop Sidebar - Converted to Gamified Floating Panel */}
      <aside
        className="hidden md:flex flex-col h-[calc(100vh-2rem)] py-6 px-3 w-[280px] fixed left-4 top-4 rounded-2xl z-50 backdrop-blur-xl border border-cyan-500/20 overflow-hidden"
        style={{ 
          background: "linear-gradient(145deg, rgba(10, 15, 25, 0.6) 0%, rgba(2, 4, 10, 0.9) 100%)", 
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 242, 255, 0.05)" 
        }}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-color-dodge pointer-events-none" />
        <div className="mb-8 px-2">
          <div
            className="font-black mb-6 whitespace-nowrap text-center relative"
            style={{
              color: "#fff",
              fontFamily: "var(--ss-font-display)",
              fontSize: "24px",
              letterSpacing: "0.15em",
              lineHeight: 1.1,
              textShadow: "0 0 10px rgba(0, 242, 255, 0.8), 0 0 20px rgba(0, 150, 255, 0.6), 0 0 30px rgba(0, 50, 255, 0.4)",
              textTransform: "uppercase"
            }}
          >
            SummonScroll
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div className="w-12 h-12 rounded-xl grid place-items-center font-black text-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-cyan-300/50">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">
                {displayName}
              </div>
              <div className="text-[10px] flex items-center gap-1.5 mt-1 font-mono uppercase tracking-widest text-cyan-200/70">
                {classIcon && (
                  <Icon name={classIcon as any} size={10} />
                )}
                <span>
                  Lv. {level}
                  {playerClass &&
                    playerClass !== "none" &&
                    ` • ${playerClass}`}
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
      className={`relative flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all duration-300 group overflow-hidden ${
        active 
          ? "bg-cyan-950/40 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]" 
          : "border border-transparent hover:bg-white/5 hover:border-white/10"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {/* Active Indicator Glow */}
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
      )}
      
      {/* Hover Light Sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700" />

      <div className={`relative z-10 ${active ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" : "text-slate-400 group-hover:text-slate-200"}`}>
        <Icon name={item.icon as any} size={isPrimary ? 22 : 18} />
      </div>
      <span className={`relative z-10 uppercase tracking-widest font-bold text-sm ${active ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
        {item.label}
      </span>
    </Link>
  );
}
