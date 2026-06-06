import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Hub", icon: "castle" },
  { to: "/island", label: "Island", icon: "explore" },
  { to: "/altar", label: "Altar", icon: "auto_awesome" },
  { to: "/battle", label: "Battle", icon: "swords" },
  { to: "/compendium", label: "Compendium", icon: "menu_book" },
  { to: "/guild", label: "Guild", icon: "groups" },
  { to: "/fusion", label: "Fusion", icon: "cyclone" },
  { to: "/bazaar", label: "Shop", icon: "storefront" },
  { to: "/profile", label: "Profile", icon: "person" },
] as const;

export function GameSidebar({ displayName, level }: { displayName: string; level: number }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }
  return (
    <aside
      className="hidden md:flex flex-col h-full py-6 px-3 w-[260px] fixed left-0 top-0 border-r z-50"
      style={{ background: "#0F121A", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mb-6 px-3">
        <div
          className="text-xl font-bold mb-4"
          style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}
        >
          SummonScroll
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full grid place-items-center font-bold"
            style={{
              background: "linear-gradient(135deg,#C89A3E,#FFD54F)",
              color: "#0C0E14",
            }}
          >
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>
              {displayName}
            </div>
            <div className="text-xs" style={{ color: "#A09D96" }}>
              Level {level}
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm"
              style={{
                background: active ? "rgba(200,154,62,0.12)" : "transparent",
                color: active ? "#FFD54F" : "#A09D96",
                borderLeft: active ? "3px solid #FFD54F" : "3px solid transparent",
              }}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="uppercase tracking-wider text-[12px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={signOut}
        className="mt-4 mx-2 px-3 py-2 text-xs uppercase tracking-widest rounded-md border"
        style={{ color: "#A09D96", borderColor: "rgba(255,255,255,0.08)" }}
      >
        Sign out
      </button>
    </aside>
  );
}
