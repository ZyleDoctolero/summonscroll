import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "@/components/ui/Icon";
import { motion } from "motion/react";
import { HUB_TABS, ROSTER_TABS, VOID_TABS, ALTAR_TABS } from "./SubNav";

const NAV_ITEMS = [
  { path: "/", id: "hub", tabs: HUB_TABS, icon: "hub", label: "Hub", color: "var(--gold-bright)" },
  {
    path: "/compendium",
    id: "roster",
    tabs: ROSTER_TABS,
    icon: "book",
    label: "Roster",
    color: "var(--cyan)",
  },
  {
    path: "/battle",
    id: "void",
    tabs: VOID_TABS,
    icon: "swords",
    label: "Void",
    color: "var(--ember)",
  },
  {
    path: "/altar",
    id: "altar",
    tabs: ALTAR_TABS,
    icon: "scroll",
    label: "Altar",
    color: "var(--accent-void)",
  },
];

export function BottomHUD() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pb-4 px-4 pointer-events-none">
      <div
        className="flex items-center gap-2 md:gap-4 p-2 rounded-full pointer-events-auto shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-t border-[rgba(212,175,63,0.3)] backdrop-blur-md"
        style={{
          background: "linear-gradient(180deg, rgba(20,10,35,0.8) 0%, rgba(10,5,18,0.95) 100%)",
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
                  ? `radial-gradient(circle at center, ${item.color}20 0%, transparent 70%)`
                  : "transparent",
                boxShadow: isActive
                  ? `inset 0 0 15px ${item.color}30, 0 0 20px ${item.color}20`
                  : "none",
                border: isActive ? `1px solid ${item.color}80` : "1px solid transparent",
              }}
            >
              <Icon
                name={item.icon as React.ComponentProps<typeof Icon>["name"]}
                size={isActive ? 28 : 24}
                color={isActive ? item.color : "var(--ink-secondary)"}
                className={
                  isActive
                    ? "lucide-glow drop-shadow-[0_0_8px_currentColor]"
                    : "opacity-70 group-hover:opacity-100 group-hover:drop-shadow-[0_0_5px_currentColor] transition-all"
                }
              />
              {isActive && (
                <motion.div
                  layoutId="bottomHudActive"
                  className="absolute -bottom-1 w-8 h-1.5 rounded-full"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 12px ${item.color}, 0 0 20px ${item.color}`,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
