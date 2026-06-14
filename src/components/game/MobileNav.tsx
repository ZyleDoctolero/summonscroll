import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "@/components/ui/Icon";

const NAV_ITEMS = [
  { label: 'Hub',    icon: 'crown',    path: '/' },
  { label: 'Altar',  icon: 'star',     path: '/altar' },
  { label: 'Island', icon: 'castle',   path: '/island' },
  { label: 'Battle', icon: 'battle',   path: '/battle' },
  { label: 'More',   icon: 'tome',     path: '/compendium' },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden"
         style={{ 
           background: 'var(--bg-elevated)', 
           borderTop: '1px solid var(--ss-hairline-active)',
           paddingBottom: 'env(safe-area-inset-bottom)'
         }}>
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-opacity"
              style={{ 
                color: active ? 'var(--gold-bright)' : 'var(--ink-secondary)',
                opacity: active ? 1 : 0.6
              }}
            >
              <Icon name={item.icon as any} size={22} color={active ? 'var(--gold-bright)' : 'var(--ink-secondary)'} />
              <span className="text-[10px] mt-1 font-medium tracking-wide">{item.label}</span>
              {active && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: 'var(--gold-bright)' }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
