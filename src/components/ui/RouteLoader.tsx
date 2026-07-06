/**
 * RouteLoader — Suspense fallback for lazy-loaded routes
 * 
 * Displays a skeleton loading state that matches the app shell layout.
 * Used as the fallback for React.Suspense boundaries wrapping lazy route components.
 */

export function RouteLoader() {
  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4 animate-pulse">
      {/* Page title skeleton */}
      <div className="h-8 w-48 bg-bg-elevated rounded-md" />
      
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-bg-elevated rounded-md" />
        <div className="h-4 w-5/6 bg-bg-elevated rounded-md" />
        <div className="h-4 w-4/6 bg-bg-elevated rounded-md" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-64 bg-bg-elevated rounded-lg"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * MinimalRouteLoader — Lightweight fallback for fast-loading routes
 * 
 * Use for routes that load quickly (< 100ms) to avoid flash of loading state.
 */
export function MinimalRouteLoader() {
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="h-8 w-48 bg-bg-elevated rounded-md animate-pulse" />
    </div>
  )
}
