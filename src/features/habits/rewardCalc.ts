import type { CurrencyReward, HabitDifficulty } from '@/types'

const BASE_CRYSTALS: Record<HabitDifficulty, number> = {
  trivial: 5,
  easy:    10,
  medium:  20,
  hard:    30,
}

const BASE_XP: Record<HabitDifficulty, number> = {
  trivial: 10,
  easy:    20,
  medium:  40,
  hard:    60,
}

/**
 * Calculate the currency reward for completing a habit.
 * Streak multiplier: every 7 days adds +10% (capped at +100%).
 */
export function calculateHabitReward(
  difficulty: HabitDifficulty,
  streakCount: number,
): CurrencyReward {
  const streakBonus = Math.min(2.0, 1 + Math.floor(streakCount / 7) * 0.1)

  const crystals = Math.round(BASE_CRYSTALS[difficulty] * streakBonus)
  const xp = Math.round(BASE_XP[difficulty] * streakBonus)

  // Void Shards: awarded at 7-day streak milestones
  const voidShards = streakCount > 0 && streakCount % 7 === 0 ? 1 : 0

  // Pact Seals: awarded at 30-day streak milestones
  const pactSeals = streakCount > 0 && streakCount % 30 === 0 ? 1 : 0

  return { spiritCrystals: crystals, voidShards, pactSeals, xp }
}

/**
 * Calculate streak health percentage (0–100).
 * Health degrades if the habit wasn't completed yesterday.
 */
export function calculateStreakHealth(
  _streakCount: number,
  lastCompletedAt: string | null,
): number {
  if (!lastCompletedAt) return 100

  const last = new Date(lastCompletedAt)
  const now = new Date()
  const daysDiff = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (daysDiff === 0) return 100          // completed today
  if (daysDiff === 1) return 66           // missed yesterday
  if (daysDiff === 2) return 33           // missed 2 days
  return 0                                // broken
}

/**
 * Get the streak health color class.
 */
export function getStreakHealthColor(health: number): string {
  if (health >= 66) return 'var(--color-success)'
  if (health >= 33) return 'var(--color-warning)'
  if (health > 0)   return 'var(--color-danger)'
  return 'var(--color-text-tertiary)'
}
