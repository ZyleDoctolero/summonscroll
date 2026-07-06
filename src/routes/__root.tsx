import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import { authApi } from '@/features/auth/api/auth.api'
import { api } from '@/lib/api'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoginRewardModal } from '@/components/ui/LoginReward'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { ApiResponse } from '@/types'

function NotFound() {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="font-cinzel text-48 text-text-primary">404</h1>
        <p className="text-18 text-text-secondary">Page not found</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-gold text-bg-deep rounded-lg font-medium hover:bg-gold-bright transition-colors"
        >
          Go to Hub
        </Link>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const { accessToken, setUser, logout } = useUserStore()
  const [showLoginReward, setShowLoginReward] = useState(false)
  const location = useLocation()
  
  // Initialize WebSocket connection
  useWebSocket()

  useEffect(() => {
    if (!accessToken) return

    authApi
      .me()
      .then((res) => {
        setUser(res.data)
        // Check if the user can claim today's login reward
        return api.get<ApiResponse<{ canClaimToday: boolean }>>('/auth/login-reward/status')
      })
      .then((statusRes) => {
        if (statusRes.data.canClaimToday) {
          setShowLoginReward(true)
        }
      })
      .catch(() => {
        logout()
      })
  }, []) // Run once on mount

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
      {showLoginReward && (
        <LoginRewardModal onClose={() => setShowLoginReward(false)} />
      )}
    </ErrorBoundary>
  )
}
