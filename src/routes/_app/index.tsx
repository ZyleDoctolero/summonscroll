import { createFileRoute, redirect } from '@tanstack/react-router'
import { useUserStore } from '@/stores/userStore'

// /_app/ index — redirect to /hub
export const Route = createFileRoute('/_app/')({
  beforeLoad: () => {
    const isAuthenticated = useUserStore.getState().isAuthenticated
    throw redirect({
      to: isAuthenticated ? '/hub' : '/auth/login',
      replace: true,
    })
  },
  component: () => null,
})
