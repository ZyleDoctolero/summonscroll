import { createFileRoute, Outlet, Link, useRouterState, redirect } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { CurrencyBar } from '@/components/ui/CurrencyBar'
import { PlayerHeader } from '@/components/ui/PlayerHeader'
import { NavItem } from '@/components/ui/NavItem'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'
import { slideInRight, fadeIn } from '@/lib/animations'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const isAuthenticated = useUserStore.getState().isAuthenticated
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login', replace: true })
    }
  },
  component: AppShell,
})

const NAV_ITEMS = [
  { to: '/hub',        label: 'Hub',        icon: '/images/summonscroll/icons/icon_hub.png', ariaLabel: 'Hub' },
  { to: '/island',     label: 'Island',     icon: '/images/summonscroll/icons/icon_island.png', ariaLabel: 'Island' },
  { to: '/altar',      label: 'Altar',      icon: '/images/summonscroll/icons/icon_altar.png',  ariaLabel: 'Altar' },
  { to: '/battles',    label: 'Battle',     icon: '/images/summonscroll/icons/icon_battles.png',  ariaLabel: 'Battle' },
  { to: '/compendium', label: 'Compendium', icon: '/images/summonscroll/icons/icon_compendium.png', ariaLabel: 'Compendium' },
] as const

const DRAWER_ITEMS = [
  { to: '/guild',   label: 'Sanctuary', icon: '/images/summonscroll/guild_crest.jpg' },
  { to: '/fusion',  label: 'Fusion',  icon: '/images/summonscroll/icons/icon_fusion.png' },
  { to: '/shop',    label: 'Shop',    icon: '/images/summonscroll/icons/icon_shop.png' },
  { to: '/profile', label: 'Profile', icon: '/images/summonscroll/icons/icon_profile.png' },
  { to: '/settings',label: 'Settings',icon: '/images/summonscroll/icons/icon_settings.png' },
] as const

const BG_MAP: Record<string, string> = {
  '/hub':        '/images/summonscroll/hub_bg.jpg',
  '/battles':    '/images/summonscroll/arcane_battleground_bg.jpg',
  '/compendium': '/images/summonscroll/compendium_bg.jpg',
  '/directives': '/images/summonscroll/directives_bg.jpg',
  '/fusion':     '/images/summonscroll/fusion_altar_bg.jpg',
  '/guild':      '/images/summonscroll/sanctuary_bg.jpg',
  '/profile':    '/images/summonscroll/profile_bg.jpg',
  '/shop':       '/images/summonscroll/shop_bg.jpg',
  '/settings':   '/images/summonscroll/settings_bg.jpg',
}

function getBackgroundImage(path: string): string | null {
  for (const [prefix, img] of Object.entries(BG_MAP)) {
    if (path.startsWith(prefix)) return img
  }
  return null
}

function AppShell() {
  const { isDrawerOpen, toggleDrawer, closeDrawer } = useUiStore()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const bgImage = getBackgroundImage(currentPath)

  return (
    <div className="flex flex-col min-h-dvh bg-bg-deep lg:flex-row relative">
      {bgImage && (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none z-0 transition-all duration-700"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 bg-bg-surface border-r border-border shrink-0 fixed top-0 left-0 h-full z-nav"
        aria-label="Main navigation"
      >
        <div className="p-4 border-b border-border">
          <PlayerHeader />
        </div>

        <div className="px-4 py-3 border-b border-border">
          <CurrencyBar className="flex-col items-start gap-1.5" />
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavItem
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  isActive={currentPath.startsWith(item.to)}
                />
              </li>
            ))}
          </ul>

          <div className="mx-4 my-2 border-t border-border" />

          <ul className="space-y-0.5 px-2">
            {DRAWER_ITEMS.map((item) => (
              <li key={item.to}>
                <NavItem
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  isActive={currentPath.startsWith(item.to)}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile / Tablet Header */}
        <header
          className="lg:hidden sticky top-0 z-nav bg-bg-surface border-b border-border px-4 py-2 flex items-center justify-between gap-3"
        >
          <PlayerHeader className="flex-1 min-w-0" />
          <CurrencyBar />
          <button
            onClick={toggleDrawer}
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            aria-label="Open menu"
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-drawer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect y="3" width="20" height="2" rx="1" />
              <rect y="9" width="20" height="2" rx="1" />
              <rect y="15" width="20" height="2" rx="1" />
            </svg>
          </button>
        </header>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="lg:hidden fixed inset-0 bg-bg-overlay z-modal"
                onClick={closeDrawer}
                aria-hidden="true"
              />
              <motion.div
                id="mobile-drawer"
                variants={slideInRight}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="lg:hidden fixed top-0 right-0 h-full w-64 bg-bg-elevated z-modal border-l border-border shadow-xl"
                role="dialog"
                aria-label="Navigation menu"
                aria-modal="true"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-cinzel font-semibold text-16 text-text-primary">
                    Menu
                  </span>
                  <button
                    onClick={closeDrawer}
                    className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>
                <nav className="p-2">
                  <ul className="space-y-0.5">
                    {DRAWER_ITEMS.map((item) => (
                      <li key={item.to}>
                        <NavItem
                          to={item.to}
                          label={item.label}
                          icon={item.icon}
                          isActive={currentPath.startsWith(item.to)}
                          onClick={closeDrawer}
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page content */}
        <main id="main-content" className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-nav bg-bg-surface border-t border-border"
        aria-label="Bottom navigation"
      >
        <ul className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.to)
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 gap-0.5 transition-all min-h-[56px]',
                    isActive
                      ? 'text-gold'
                      : 'text-text-tertiary hover:text-text-secondary',
                  )}
                  aria-label={item.ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'w-6 h-6 mb-1 rounded-md overflow-hidden mix-blend-multiply shadow-sm transition-transform',
                      isActive && 'scale-110 border border-gold',
                    )}
                    aria-hidden="true"
                  >
                    <img src={item.icon} alt="" className="w-full h-full object-cover rounded-sm" />
                  </span>
                  <span className="text-10 font-medium">{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 w-8 h-0.5 bg-gold rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
