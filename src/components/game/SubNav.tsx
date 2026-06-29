import { Link, useRouterState } from "@tanstack/react-router";

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
  { path: "/cross-fusion", label: "X-Fusion" },
  { path: "/akashic-records", label: "Akashic" },
  { path: "/race-skills", label: "Race Skills" },
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
    <nav
      aria-label="Section navigation"
      className="w-full flex mb-6 overflow-x-auto no-scrollbar relative z-20"
      style={{
        background: "rgba(12, 10, 6, 0.96)",
        border: "2px solid rgba(200,154,62,0.2)",
        borderRadius: 0,
        boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex-1 py-3 px-3 whitespace-nowrap text-center transition-all relative flex items-center justify-center"
            style={{
              fontFamily: "var(--ss-font-pixel)",
              fontSize: 10,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: isActive ? color : "var(--ink-tertiary)",
              background: isActive ? `rgba(200,154,62,0.08)` : "transparent",
              borderBottom: isActive ? `3px solid ${color}` : "3px solid transparent",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
