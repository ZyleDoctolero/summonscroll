import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { habitsApi } from '../api/habits.api'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { calculateStreakHealth, getStreakHealthColor } from '../rewardCalc'
import { useBondInvalidation } from '@/features/monsters/bondService'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { Habit, HabitDifficulty } from '@/types'

const DIFFICULTY_LABELS: Record<HabitDifficulty, string> = {
  trivial: 'Trivial',
  easy:    'Easy',
  medium:  'Medium',
  hard:    'Hard',
}

const DIFFICULTY_STARS: Record<HabitDifficulty, string> = {
  trivial: '☆',
  easy:    '⭐',
  medium:  '⭐⭐',
  hard:    '⭐⭐⭐',
}

const CATEGORY_ICONS: Record<string, string> = {
  study:       '📚',
  fitness:     '💪',
  meditation:  '🧘',
  sleep:       '😴',
  nutrition:   '🥗',
  productivity:'⚡',
  custom:      '🎯',
}

interface HabitCardProps {
  habit: Habit
  realmColor?: string
}

export function HabitCard({ habit, realmColor = 'var(--color-gold)' }: HabitCardProps) {
  const queryClient = useQueryClient()
  const { addFloatingCurrency, addToast } = useUiStore()
  const { updateCurrencies, updateXp } = useUserStore()
  const invalidateBond = useBondInvalidation()
  const reducedMotion = useReducedMotion()
  const [completionFlash, setCompletionFlash] = useState(false)

  const streakHealth = calculateStreakHealth(habit.streakCount, habit.lastCompletedAt)
  const healthColor = getStreakHealthColor(streakHealth)

  const completeMutation = useMutation({
    mutationFn: (direction: 'up' | 'down') =>
      habitsApi.completeHabit(habit.id, direction),
    onSuccess: (res) => {
      const { reward, newStreak } = res.data
      updateCurrencies({
        spiritCrystals: reward.spiritCrystals,
        voidShards: reward.voidShards,
        pactSeals: reward.pactSeals,
      })
      updateXp(reward.xp)

      // Floating currency animation — skip if user prefers reduced motion
      if (reward.spiritCrystals > 0 && !reducedMotion) {
        addFloatingCurrency(reward.spiritCrystals, 'crystals', 0, 0)
      }

      // Completion flash animation — skip if reduced motion
      if (!reducedMotion) {
        setCompletionFlash(true)
        setTimeout(() => setCompletionFlash(false), 600)
      }

      // Streak milestone toasts
      if (newStreak > 0 && newStreak % 7 === 0) {
        addToast({
          type: 'achievement',
          title: `🔥 ${newStreak}-Day Streak!`,
          message: `+${reward.voidShards} Void Shard${reward.voidShards !== 1 ? 's' : ''}`,
        })
      }
      if (newStreak > 0 && newStreak % 30 === 0) {
        addToast({
          type: 'achievement',
          title: `🔑 30-Day Streak!`,
          message: '+1 Pact Seal earned!',
        })
      }

      void queryClient.invalidateQueries({ queryKey: ['habits'] })
      // Invalidate bond-related queries so Island and Compendium update
      invalidateBond()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Failed to complete habit' })
    },
  })

  const isBroken = streakHealth === 0

  return (
    <article
      className={cn(
        'bg-bg-surface rounded-lg overflow-hidden border transition-all',
        isBroken && 'opacity-70',
      )}
      style={{
        borderColor: completionFlash ? realmColor : 'var(--color-border)',
        borderLeftWidth: '4px',
        borderLeftColor: realmColor,
        boxShadow: completionFlash ? `0 0 12px ${realmColor}60` : undefined,
        transition: completionFlash ? 'box-shadow 0.3s ease-out, border-color 0.3s ease-out' : undefined,
      }}
      aria-label={`Habit: ${habit.title}`}
    >
      <div className="p-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-16 flex-shrink-0"
              aria-hidden="true"
            >
              {CATEGORY_ICONS[habit.category] ?? '🎯'}
            </span>
            <h3 className="font-medium text-14 text-text-primary truncate">
              {habit.title}
            </h3>
          </div>

          {/* +/- buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => completeMutation.mutate('down')}
              disabled={completeMutation.isPending}
              className="w-8 h-8 rounded-md bg-danger/10 text-danger hover:bg-danger/20 transition-colors text-16 font-bold flex items-center justify-center disabled:opacity-50"
              aria-label={`Mark ${habit.title} as failed`}
            >
              −
            </button>
            <button
              onClick={() => completeMutation.mutate('up')}
              disabled={completeMutation.isPending}
              className={cn(
                'w-8 h-8 rounded-md bg-success/10 text-success hover:bg-success/20 transition-all text-16 font-bold flex items-center justify-center disabled:opacity-50',
                completionFlash && 'scale-125 bg-success/30',
              )}
              style={{
                transition: completionFlash ? 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background-color 0.3s ease' : undefined,
              }}
              aria-label={`Complete ${habit.title}`}
            >
              {completionFlash ? '✓' : '+'}
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 text-12 text-text-secondary">
          <span
            aria-label={`Difficulty: ${DIFFICULTY_LABELS[habit.difficulty]}`}
          >
            {DIFFICULTY_STARS[habit.difficulty]} {DIFFICULTY_LABELS[habit.difficulty]}
          </span>
          <span aria-hidden="true">·</span>
          {habit.streakCount > 0 ? (
              <span
              className={cn(
                'flex items-center gap-1 font-mono font-bold',
                isBroken ? 'text-text-tertiary' : 'text-warning',
              )}
              aria-label={`${habit.streakCount}-day streak`}
            >
              {isBroken ? '❄' : <img src="/images/summonscroll/fire_streak.jpg" alt="Fire Streak" className="w-4 h-4 object-contain" />} {habit.streakCount}
            </span>
          ) : (
            <span className="text-text-tertiary">No streak</span>
          )}
        </div>

        {/* Streak health bar */}
        <div className="mt-2">
          <div
            className="h-1.5 bg-bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={streakHealth}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Streak health: ${streakHealth}%`}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${streakHealth}%`,
                backgroundColor: healthColor,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
