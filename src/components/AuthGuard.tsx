import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useUserStore } from '@/stores/userStore'
import type { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: '/auth/login', replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  return <>{children}</>
}
