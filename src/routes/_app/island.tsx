import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { useUserStore } from '@/stores/userStore'
import { habitsApi } from '@/features/habits/api/habits.api'
import { TeamSlots } from '@/features/island/components/TeamSlots'
import { BiomeSelector } from '@/features/island/components/BiomeSelector'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/island')({
  component: () => (
    <ErrorBoundary>
      <IslandPage />
    </ErrorBoundary>
  ),
})

function getWeatherState(completionPercent: number) {
  if (completionPercent >= 100) return {
    label: 'Sunny',
    icon: '☀️',
    bgClass: 'bg-gradient-to-b from-amber-800 via-amber-900 to-bg-deep',
    overlayClass: 'from-amber-900/20 to-bg-deep',
  }
  if (completionPercent >= 50) return {
    label: 'Overcast',
    icon: '⛅',
    bgClass: 'bg-gradient-to-b from-slate-700 via-slate-800 to-bg-deep',
    overlayClass: 'from-slate-800/40 to-bg-deep',
  }
  return {
    label: 'Stormy',
    icon: '⛈',
    bgClass: 'bg-gradient-to-b from-slate-900 via-slate-900 to-bg-deep',
    overlayClass: 'from-slate-900/60 to-bg-deep',
  }
}

const BIOME_ICONS: Record<string, string> = {
  verdant: '🌿',
  volcanic: '🌋',
  arctic: '❄️',
  void: '🌌',
}

function IslandPage() {
  const user = useUserStore((s) => s.user)
  const [activeBiome, setActiveBiome] = useState('verdant')

  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: habitsApi.getHabits,
    staleTime: 30_000,
  })

  const habits = habitsData?.data ?? []
  const activeHabits = habits.filter((h) => h.isActive)
  const completedToday = activeHabits.filter(
    (h) => h.lastCompletedAt !== null &&
      new Date(h.lastCompletedAt).toDateString() === new Date().toDateString(),
  )
  const completionPercent =
    activeHabits.length === 0
      ? 100
      : Math.round((completedToday.length / activeHabits.length) * 100)

  const weather = getWeatherState(completionPercent)

  return (
    <AnimatedPage className="min-h-screen pb-32 bg-bg-deep/50">
      {/* Island scene */}
      <div
        className={cn('relative w-full h-80 pt-20 flex items-end justify-center pb-4 overflow-hidden shadow-inner', weather.bgClass)}
        aria-label={`Island — ${weather.label} weather`}
      >
        <div className={cn('absolute inset-0 bg-gradient-to-b', weather.overlayClass)} />
        <div className="absolute top-3 right-3 bg-bg-overlay/80 backdrop-blur-md border border-border/20 rounded-pill px-3 py-1.5 text-13 shadow-lg flex items-center gap-2">
          <span aria-hidden="true" className="drop-shadow-md">{weather.icon}</span>
          <span className="font-medium text-text-primary tracking-wide">{weather.label}</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <span className="text-[120px]" aria-hidden="true">
            {BIOME_ICONS[activeBiome] ?? '⭐'}
          </span>
        </div>

        <div className="text-center z-10 space-y-2">
          {activeHabits.length === 0 ? (
            <>
              <p className="text-48 mb-1" aria-hidden="true">🏝</p>
              <p className="font-cinzel text-16 text-text-primary">
                Your island awaits its first inhabitant.
              </p>
              <p className="text-text-tertiary text-13">
                Complete habits to summon monsters, then assign them to your team.
              </p>
              <Link
                to="/directives"
                className="inline-block mt-2 px-4 py-2 bg-gold text-bg-deep rounded-lg font-medium text-14 hover:bg-gold-bright transition-colors"
              >
                Start a Habit →
              </Link>
            </>
          ) : (
            <>
              <p className="text-text-tertiary text-13">
                Assign monsters to your team to inhabit your island.
              </p>
              <Link
                to="/compendium"
                className="text-gold text-13 hover:text-gold-bright transition-colors"
              >
                Open Compendium →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-32 max-w-2xl mx-auto space-y-6">
        <TeamSlots />

        <BiomeSelector
          currentLevel={user?.level ?? 1}
          activeBiome={activeBiome}
          onSelect={setActiveBiome}
        />

        {/* Habit status summary */}
        <div className="bg-bg-surface/60 backdrop-blur-xl rounded-xl p-5 border border-border/20 shadow-[0_4px_24px_rgba(0,0,0,0.2)] relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold to-gold-bright shadow-[0_0_10px_rgba(255,184,77,0.5)]" />

          <h3 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-2">
            Today's Habit Status
          </h3>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={completionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${completionPercent}% of today's habits completed`}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${completionPercent}%`,
                  backgroundColor:
                    completionPercent >= 100 ? 'var(--color-success)' :
                    completionPercent >= 50  ? 'var(--color-warning)' :
                    'var(--color-danger)',
                }}
              />
            </div>
            <span className="font-serif text-13 text-text-secondary">
              {completionPercent}%
            </span>
          </div>
          <p className="text-12 text-text-tertiary mt-1.5">
            {completionPercent >= 100
              ? 'All habits complete! Your monsters are thriving.'
              : completionPercent >= 50
              ? 'Keep going — your monsters are watching.'
              : 'Your monsters are weakening. Complete your habits!'}
          </p>
        </div>
      </div>
    </AnimatedPage>
  )
}
