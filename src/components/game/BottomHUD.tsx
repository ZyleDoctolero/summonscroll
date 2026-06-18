import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "@/components/ui/Icon";
import { motion } from "motion/react";
import { HUB_TABS, ROSTER_TABS, VOID_TABS, ALTAR_TABS } from "./SubNav";

const NAV_ITEMS = [
  { path: "/", id: "hub", tabs: HUB_TABS, icon: "hub", label: "Hub", color: "#FFD54F", colorRgb: "255,213,79" },
  {
    path: "/compendium",
    id: "roster",
    tabs: ROSTER_TABS,
    icon: "book",
    label: "Roster",
    color: "#38B8F5",
    colorRgb: "56,184,245",
  },
  {
    path: "/battle",
    id: "void",
    tabs: VOID_TABS,
    icon: "swords",
    label: "Void",
    color: "#FF5E2A",
    colorRgb: "255,94,42",
  },
  {
    path: "/altar",
    id: "altar",
    tabs: ALTAR_TABS,
    icon: "scroll",
    label: "Altar",
    color: "#CE93D8",
    colorRgb: "206,147,216",
  },
];

export function BottomHUD() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pb-4 px-4 pointer-events-none">
      <div
        className="flex items-center gap-2 md:gap-4 p-2 rounded-full pointer-events-auto shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
        style={{
          background: "rgba(8, 8, 20, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,213,79,0.15)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          // It's active if the current pathname matches the pillar's path OR any of its sub-tabs
          const isActive = item.tabs.some((t) => t.path === pathname) || pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className="relative group flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 z-10"
              style={{
                background: isActive
                  ? `rgba(${item.colorRgb}, 0.18)`
                  : "transparent",
                boxShadow: isActive
                  ? `0 2px 10px rgba(0,0,0,0.5)`
                  : "none",
                border: isActive ? `1.5px solid ${item.color}` : "1.5px solid transparent",
              }}
            >
              <Icon
                name={item.icon as React.ComponentProps<typeof Icon>["name"]}
                size={isActive ? 28 : 24}
                color={isActive ? item.color : "var(--ink-secondary)"}
                className={
                  isActive
                    ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    : "opacity-70 group-hover:opacity-100 group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-all"
                }
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
