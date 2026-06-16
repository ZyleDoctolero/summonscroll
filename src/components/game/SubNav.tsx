import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";

export interface SubNavItem {
  path: string;
  label: string;
}

export const HUB_TABS: SubNavItem[] = [
  { path: "/", label: "Tasks" },
  { path: "/island", label: "Sanctuary" },
  { path: "/guild", label: "Guild" },
  { path: "/penalty-zone", label: "Penalty" },
  { path: "/profile", label: "Profile" },
];

export const ROSTER_TABS: SubNavItem[] = [
  { path: "/compendium", label: "Compendium" },
  { path: "/fusion", label: "Fusion" },
  { path: "/akashic-records", label: "Akashic" },
  { path: "/forge", label: "Forge" },
];

export const VOID_TABS: SubNavItem[] = [
  { path: "/battle", label: "Campaign" },
  { path: "/trial", label: "Trial" },
  { path: "/expeditions", label: "Expedition" },
  { path: "/quests", label: "Quests" },
];

export const ALTAR_TABS: SubNavItem[] = [
  { path: "/altar", label: "Summon" },
  { path: "/bazaar", label: "Bazaar" },
];

export function SubNav({ items, color = "var(--cyan)" }: { items: SubNavItem[]; color?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="w-full flex gap-1 p-1 bg-[#0a0514]/80 border border-cyan-900/30 rounded-lg mb-6 overflow-x-auto no-scrollbar relative z-20 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(0,240,255,0.05)]">
      {items.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 py-3 px-3 text-[10px] md:text-xs uppercase tracking-widest font-bold whitespace-nowrap text-center rounded-md transition-all relative z-10 flex items-center justify-center`}
            style={{
              color: isActive ? color : "var(--ink-secondary)",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="subNavActive"
                className="absolute inset-0 rounded bg-white/5 border-b-2 -z-10"
                style={{ borderColor: color, boxShadow: `inset 0 -10px 20px -10px ${color}50` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
