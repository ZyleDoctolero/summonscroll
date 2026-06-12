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

const NAV_BOTTOM = [
  { to: "/profile", label: "Profile", icon: "bond" },
] as const;

const CLASS_ICONS: Record<string, string> = {
  warrior: "⚔", mage: "🔮", healer: "💚", rogue: "🗡", none: "",
};

export function GameSidebar({ displayName, level, playerClass }: {
  displayName: string; level: number; playerClass?: string;
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
        className="hidden md:flex flex-col h-full py-6 px-3 w-[260px] fixed left-0 top-0 border-r z-50"
        style={{ background: "var(--bg-stage)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mb-6 px-3">
          <div className="t-display text-xl font-bold mb-4" style={{ color: "var(--gold-bright)" }}>
            SummonScroll
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full grid place-items-center font-bold ss-btn-d-primary">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>{displayName}</div>
              <div className="text-xs" style={{ color: "#A09D96" }}>
                {classIcon} Level {level}
                {playerClass && playerClass !== "none" && ` · ${playerClass[0].toUpperCase() + playerClass.slice(1)}`}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV_DAILY.map((item) => <NavLink key={item.to} item={item} path={path} weight="primary" />)}
          <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
          {NAV_WEEKLY.map((item) => <NavLink key={item.to} item={item} path={path} weight="secondary" />)}
          <button
            onClick={() => setMoreOpen(true)}
            className="ss-nav-more"
          >
            <MoreHorizontal size={16} />
            More
          </button>
          <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
          {NAV_BOTTOM.map((item) => <NavLink key={item.to} item={item} path={path} weight="primary" />)}
        </nav>

        <div className="mt-4 mx-2 flex gap-2">
          <button
            onClick={toggleMute}
            title={mute ? "Unmute" : "Mute"}
            aria-label={mute ? "Unmute" : "Mute"}
            className="px-3 py-2 text-base rounded-md border transition-colors hover:bg-white/5"
            style={{ color: mute ? "#6B6864" : "#FFD54F", borderColor: "rgba(255,255,255,0.08)" }}
          >
            {mute ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={signOut}
            className="flex-1 px-3 py-2 text-xs uppercase tracking-widest rounded-md border transition-colors hover:bg-white/5"
            style={{ color: "#A09D96", borderColor: "rgba(255,255,255,0.08)" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t backdrop-blur-md"
        style={{ background: "rgba(15,18,26,0.95)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        {NAV_DAILY.map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[44px] transition-colors"
              style={{ color: active ? "#FFD54F" : "#6B6864" }}
            >
              <Icon name={item.icon as any} size={20} />
              <span className="text-[9px] uppercase tracking-wider font-semibold">{item.label}</span>
              {active && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: "var(--gold-bright)" }} />}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[44px] transition-colors"
          style={{ color: "var(--ink-tertiary)" }}
        >
          <MoreHorizontal size={20} />
          <span className="text-[9px] uppercase tracking-wider font-semibold">More</span>
        </button>
      </nav>
      
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}

function NavLink({ item, path, weight = "primary" }: {
  item: { to: string; label: string; icon: string };
  path: string;
  weight?: "primary" | "secondary";
}) {
  const active = path === item.to;
  const isPrimary = weight === "primary";
  
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-3 rounded-md transition-all ${isPrimary ? "ss-nav-primary" : "ss-nav-secondary"}`}
      style={{
        background: active ? (isPrimary ? "rgba(200,154,62,0.12)" : "rgba(255,255,255,0.03)") : "transparent",
        color: active ? (isPrimary ? "#FFD54F" : "#F0EDE6") : (isPrimary ? "#A09D96" : "#6B6864"),
        borderLeft: active ? (isPrimary ? "3px solid #FFD54F" : "2px solid #A09D96") : (isPrimary ? "3px solid transparent" : "2px solid transparent"),
        padding: isPrimary ? "10px 14px" : "6px 12px",
        fontSize: isPrimary ? "14px" : "12px",
        fontWeight: isPrimary ? 600 : 500,
      }}
    >
      <Icon name={item.icon as any} size={isPrimary ? 22 : 18} />
      <span className="uppercase tracking-wider font-semibold">{item.label}</span>
    </Link>
  );
}
