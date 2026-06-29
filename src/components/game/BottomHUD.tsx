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
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none">
      <nav
        aria-label="Main navigation"
        className="flex items-stretch w-full max-w-md pointer-events-auto"
        style={{
          background: "rgba(14, 11, 7, 0.97)",
          borderTop: "2px solid rgba(200, 154, 62, 0.35)",
          boxShadow: "0 -3px 0 rgba(0,0,0,0.5)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.tabs.some((t) => t.path === pathname) || pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className="relative flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-100"
              style={{
                background: isActive ? `rgba(${item.colorRgb}, 0.12)` : "transparent",
                borderTop: isActive ? `2px solid ${item.color}` : "2px solid transparent",
                marginTop: -2,
              }}
            >
              <Icon
                name={item.icon as React.ComponentProps<typeof Icon>["name"]}
                size={isActive ? 22 : 20}
                color={isActive ? item.color : "var(--ink-tertiary)"}
              />
              <span
                style={{
                  fontFamily: "var(--ss-font-pixel)",
                  fontSize: 9,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: isActive ? item.color : "var(--ink-tertiary)",
                  lineHeight: 1,
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
