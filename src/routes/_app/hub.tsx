import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MinimalRouteLoader } from '@/components/ui/RouteLoader'

// Lazy load the hub page component
const HubPage = lazy(() =>
  import('@/features/hub/components/HubPage').then((m) => ({ default: m.HubPage })),
)

export const Route = createFileRoute('/_app/hub')({
  component: () => (
    <ErrorBoundary>
      <Suspense fallback={<MinimalRouteLoader />}>
        <HubPage />
      </Suspense>
    </ErrorBoundary>
  ),
})
