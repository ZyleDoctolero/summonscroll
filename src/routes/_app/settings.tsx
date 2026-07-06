import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useUserStore } from '@/stores/userStore'
import { authApi } from '@/features/auth/api/auth.api'
import { useNavigate } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/settings')({
  component: () => (
    <ErrorBoundary>
      <SettingsPage />
    </ErrorBoundary>
  ),
})

/** Read the OS-level prefers-reduced-motion, but let user override via localStorage */
function getInitialReducedMotion(): boolean {
  const stored = localStorage.getItem('ss-reduced-motion')
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function SettingsPage() {
  const { logout } = useUserStore()
  const navigate = useNavigate()
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion)
  const [notifications, setNotifications] = useState(true)

  // Sync reduced-motion preference to <html> class and localStorage
  const applyReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotion(enabled)
    localStorage.setItem('ss-reduced-motion', String(enabled))
    if (enabled) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [])

  // Apply on mount
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout()
      void navigate({ to: '/auth/login', replace: true })
    },
  })

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-2xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">

      {/* Display */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Display
        </h2>
        <ToggleSetting
          label="Reduce Animations"
          description="Disable non-essential animations for accessibility. Overrides your OS setting."
          checked={reducedMotion}
          onChange={applyReducedMotion}
          id="reduce-motion"
        />
      </Card>

      {/* Audio */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Audio
        </h2>
        <ToggleSetting
          label="Sound Effects"
          description="Play sound effects for pulls, battles, and UI interactions"
          checked={true}
          onChange={() => {/* TODO: wire to audio store */}}
          id="sfx-toggle"
        />
        <div className="mt-3">
          <ToggleSetting
            label="Background Music"
            description="Play ambient background music"
            checked={true}
            onChange={() => {/* TODO: wire to audio store */}}
            id="bgm-toggle"
          />
        </div>
      </Card>

      {/* Notifications */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Notifications
        </h2>
        <ToggleSetting
          label="Habit Reminders"
          description="Get reminded to complete your daily habits"
          checked={notifications}
          onChange={setNotifications}
          id="notifications"
        />
      </Card>

      {/* Account */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Account
        </h2>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className={cn(
            'w-full py-2.5 rounded-md text-14 font-medium transition-colors',
            'bg-danger/10 text-danger border border-danger/30',
            'hover:bg-danger/20',
            'disabled:opacity-50',
          )}
        >
          {logoutMutation.isPending ? 'Signing out…' : 'Sign Out'}
        </button>
      </Card>
    </AnimatedPage>
  )
}

interface ToggleSettingProps {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}

function ToggleSetting({ label, description, checked, onChange, id }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-14 font-medium text-text-primary cursor-pointer">
          {label}
        </label>
        <p className="text-12 text-text-secondary mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
          checked ? 'bg-gold' : 'bg-bg-elevated border border-border-active',
        )}
        aria-label={label}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
