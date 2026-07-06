import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import * as Sentry from '@sentry/react'
import { QueryProvider } from './providers/QueryProvider'
import { ToastContainer } from './components/ui/Toast'
import { CurrencyFloatLayer } from './components/ui/CurrencyFloat'
import { LevelUpOverlay } from './components/ui/LevelUp'
import { RouteLoader } from './components/ui/RouteLoader'
import './index.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// ── Sentry initialisation ─────────────────────────────────────────────────────
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <Suspense fallback={<RouteLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <ToastContainer />
      <CurrencyFloatLayer />
      <LevelUpOverlay />
    </QueryProvider>
  </StrictMode>,
)
