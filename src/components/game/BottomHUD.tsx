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
      <nav
        aria-label="Main navigation"
        className="flex items-center gap-2 md:gap-4 p-2 rounded-full pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        style={{
          background: "rgba(16, 13, 8, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(200, 154, 62, 0.18)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          // It's active if the current pathname matches the pillar's path OR any of its sub-tabs
          const isActive = item.tabs.some((t) => t.path === pathname) || pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className="relative group flex flex-col items-center justify-center w-16 h-16 md:w-18 md:h-18 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 z-10 gap-0.5"
              style={{
                background: isActive
                  ? `rgba(${item.colorRgb}, 0.15)`
                  : "transparent",
                boxShadow: isActive
                  ? `0 2px 12px rgba(${item.colorRgb},0.25)`
                  : "none",
                border: isActive ? `1.5px solid ${item.color}` : "1.5px solid transparent",
              }}
            >
              <Icon
                name={item.icon as React.ComponentProps<typeof Icon>["name"]}
                size={isActive ? 26 : 22}
                color={isActive ? item.color : "var(--ink-secondary)"}
                className={
                  isActive
                    ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                    : "opacity-50 group-hover:opacity-80 transition-all"
                }
              />
              <span
                className="text-[11px] font-bold tracking-wider leading-none"
                style={{
                  color: isActive ? item.color : "var(--ink-secondary)",
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
