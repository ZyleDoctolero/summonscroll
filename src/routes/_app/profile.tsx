import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { Card } from '@/components/ui/Card'
import { useUserStore } from '@/stores/userStore'
import { profileApi } from '@/features/profile/api/profile.api'
import { profileKeys } from '@/features/profile/queryKeys'
import { cn } from '@/lib/utils'
import type { Achievement } from '@/types'

export const Route = createFileRoute('/_app/profile')({
  component: () => (
    <ErrorBoundary>
      <ProfilePage />
    </ErrorBoundary>
  ),
})

function ProfilePage() {
  const user = useUserStore((s) => s.user)

  const { data: achievementsData } = useQuery({
    queryKey: profileKeys.achievements(),
    queryFn: () => profileApi.getAchievements(),
    enabled: !!user,
  })

  const achievements = achievementsData?.data ?? []

  if (!user) return null

  const xpPercent = Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100))

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-2xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">

      {/* Player card */}
      <Card variant="surface">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-bg-elevated border-2 border-gold/40 flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-cinzel font-bold text-24 text-gold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-cinzel font-bold text-20 text-text-primary">
              {user.username}
            </h2>
            <p className="text-13 text-text-secondary">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-serif text-12 text-gold bg-gold/10 rounded-pill px-2 py-0.5">
                Level {user.level}
              </span>
              {user.currentStreak > 0 && (
                <span className="font-serif text-12 text-warning">
                  🔥 {user.currentStreak}-day streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <div className="flex justify-between text-12 text-text-secondary mb-1">
            <span>XP Progress</span>
            <span className="font-serif">{user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()}</span>
          </div>
          <div
            className="h-2 bg-bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={xpPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${xpPercent}%`,
                background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Stats
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Longest Streak', value: `${user.longestStreak} days`, icon: '🔥' },
            { label: 'Current Streak', value: `${user.currentStreak} days`, icon: '⚡' },
            { label: 'Spirit Crystals', value: user.spiritCrystals.toLocaleString(), icon: '💎' },
            { label: 'Void Shards', value: user.voidShards.toLocaleString(), icon: '🔷' },
            { label: 'Level', value: `${user.level}`, icon: '⭐' },
            { label: 'Pact Seals', value: user.pactSeals?.toLocaleString() ?? '0', icon: '🔑' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-bg-elevated rounded-lg p-3"
            >
              <p className="text-11 text-text-tertiary uppercase tracking-wider">{stat.label}</p>
              <p className="font-serif font-bold text-16 text-text-primary mt-0.5">
                {stat.icon} {stat.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Achievements
        </h2>
        {achievements.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-32 mb-2" aria-hidden="true">🏆</p>
            <p className="font-cinzel text-14 text-text-secondary mb-1">
              Your trophy case awaits.
            </p>
            <p className="text-13 text-text-tertiary">
              Complete habits, win battles, and summon rare monsters to earn achievements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {achievements.map((ach) => (
              <AchievementBadge key={ach.id} achievement={ach} />
            ))}
          </div>
        )}
      </Card>

      {/* Data export */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-2">
          Data
        </h2>
        <p className="text-13 text-text-secondary mb-3">
          Download a copy of all your SummonScroll data.
        </p>
        <a
          href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/user/export`}
          download
          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border rounded-lg text-14 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          📥 Export My Data
        </a>
      </Card>
    </AnimatedPage>
  )
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg border text-center',
        achievement.isUnlocked
          ? 'bg-bg-elevated border-gold/20'
          : 'bg-bg-surface border-border opacity-50',
      )}
      title={achievement.description}
      aria-label={`${achievement.name}${achievement.isUnlocked ? ' — Unlocked' : ' — Locked'}`}
    >
      <div className="w-10 h-10 rounded-full bg-bg-deep flex items-center justify-center">
        {achievement.iconUrl ? (
          <img src={achievement.iconUrl} alt="" className="w-8 h-8 object-contain" />
        ) : (
          <span className="text-20" aria-hidden="true">
            {achievement.isUnlocked ? '🏆' : '❓'}
          </span>
        )}
      </div>
      <p className="text-10 font-medium text-text-secondary leading-tight">
        {achievement.isUnlocked ? achievement.name : '???'}
      </p>
    </div>
  )
}
