import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setMuted } from "@/lib/ui/sounds";

const NAV_PRIMARY = [
  { to: "/", label: "Hub", icon: "castle" },
  { to: "/quests", label: "Quests", icon: "flag" },
  { to: "/island", label: "Island", icon: "explore" },
  { to: "/altar", label: "Altar", icon: "auto_awesome" },
  { to: "/expeditions", label: "Expeditions", icon: "terrain" },
  { to: "/forge", label: "Forge", icon: "construction" },
  { to: "/battle", label: "Battle", icon: "swords" },
  { to: "/compendium", label: "Compendium", icon: "menu_book" },
] as const;

const NAV_SECONDARY = [
  { to: "/codex", label: "Codex", icon: "import_contacts" },
  { to: "/trial", label: "Trial of Echoes", icon: "skull" },
  { to: "/guild", label: "Guild", icon: "groups" },
  { to: "/fusion", label: "Fusion", icon: "cyclone" },
  { to: "/bazaar", label: "Shop", icon: "storefront" },
] as const;

const NAV_BOTTOM = [
  { to: "/profile", label: "Profile", icon: "person" },
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
        style={{ background: "#0F121A", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mb-6 px-3">
          <div className="text-xl font-bold mb-4" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
            SummonScroll
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full grid place-items-center font-bold"
              style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
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
          {NAV_PRIMARY.map((item) => <NavLink key={item.to} item={item} path={path} />)}
          <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
          {NAV_SECONDARY.map((item) => <NavLink key={item.to} item={item} path={path} />)}
          <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
          {NAV_BOTTOM.map((item) => <NavLink key={item.to} item={item} path={path} />)}
        </nav>

        <div className="mt-4 mx-2 flex gap-2">
          <button
            onClick={toggleMute}
            title={mute ? "Unmute" : "Mute"}
            aria-label={mute ? "Unmute" : "Mute"}
            className="px-3 py-2 text-base rounded-md border transition-colors hover:bg-white/5"
            style={{ color: mute ? "#6B6864" : "#FFD54F", borderColor: "rgba(255,255,255,0.08)" }}
          >
            {mute ? "🔇" : "🔊"}
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
        {[
          { to: "/", label: "Hub", icon: "castle" },
          { to: "/island", label: "Island", icon: "explore" },
          { to: "/battle", label: "Battle", icon: "swords" },
          { to: "/guild", label: "Guild", icon: "groups" },
          { to: "/profile", label: "Profile", icon: "person" },
        ].map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
              style={{ color: active ? "#FFD54F" : "#6B6864" }}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold">{item.label}</span>
              {active && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: "#FFD54F" }} />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function NavLink({ item, path }: { item: { to: string; label: string; icon: string }; path: string }) {
  const active = path === item.to;
  return (
    <Link
      to={item.to}
      className="flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm"
      style={{
        background: active ? "rgba(200,154,62,0.12)" : "transparent",
        color: active ? "#FFD54F" : "#A09D96",
        borderLeft: active ? "3px solid #FFD54F" : "3px solid transparent",
      }}
    >
      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
      <span className="uppercase tracking-wider text-[12px] font-semibold">{item.label}</span>
    </Link>
  );
}
