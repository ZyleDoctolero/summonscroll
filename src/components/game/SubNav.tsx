import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";

export interface SubNavItem {
  path: string;
  label: string;
}

export const HUB_TABS: SubNavItem[] = [
  { path: "/", label: "Directives" },
  { path: "/island", label: "Sanctuary" },
  { path: "/guild", label: "Guild Hall" },
];

export const ROSTER_TABS: SubNavItem[] = [
  { path: "/compendium", label: "Compendium" },
  { path: "/fusion", label: "Fusion" },
  { path: "/akashic-records", label: "Akashic" },
];

export const VOID_TABS: SubNavItem[] = [
  { path: "/battle", label: "Campaign" },
  { path: "/expeditions", label: "Dispatch" },
  { path: "/quests", label: "Bounties" },
];

export const ALTAR_TABS: SubNavItem[] = [
  { path: "/altar", label: "Summon" },
  { path: "/bazaar", label: "Bazaar" },
];

export function SubNav({ items, color = "#b89947" }: { items: SubNavItem[]; color?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Section navigation" className="w-full flex gap-1 p-1 border rounded-lg mb-6 overflow-x-auto no-scrollbar relative z-20 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.4)]" style={{ background: "rgba(14,11,7,0.85)", borderColor: "rgba(200,154,62,0.15)" }}>
      {items.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 py-3 px-3 text-[11px] md:text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-center rounded-md transition-all relative z-10 flex items-center justify-center`}
            style={{
              color: isActive ? color : "var(--ink-secondary)",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="subNavActive"
                className="absolute inset-0 rounded -z-10 border-b-2"
                style={{ 
                  borderColor: color,
                  backgroundColor: "rgba(200,154,62,0.08)",
                  boxShadow: `0 1px 4px rgba(0,0,0,0.3)`
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
