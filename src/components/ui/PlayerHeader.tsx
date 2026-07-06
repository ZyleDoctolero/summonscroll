import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'

interface PlayerHeaderProps {
  className?: string
}

export function PlayerHeader({ className }: PlayerHeaderProps) {
  const user = useUserStore((s) => s.user)

  if (!user) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-2 w-32 rounded" />
        </div>
      </div>
    )
  }

  const xpPercent = Math.min(
    100,
    Math.round((user.xp / user.xpToNextLevel) * 100),
  )

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Avatar */}
      <div
        className="relative w-10 h-10 rounded-full bg-bg-elevated border-2 border-gold/40 overflow-hidden flex-shrink-0"
        aria-hidden="true"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="/images/summonscroll/default_avatar.jpg"
            alt="Default Avatar"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Level + XP */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-cinzel font-semibold text-13 text-text-primary truncate">
            {user.username}
          </span>
          <span
            className="font-mono font-bold text-11 text-gold bg-gold/10 rounded-pill px-1.5 py-0.5 flex-shrink-0"
            aria-label={`Level ${user.level}`}
          >
            LVL {user.level}
          </span>
          {user.currentStreak > 0 ? (
            <span
              className="flex items-center gap-1 animate-streak-fire flex-shrink-0"
              aria-label={`${user.currentStreak} day streak`}
              title={`${user.currentStreak}-day streak`}
            >
              <img src="/images/summonscroll/fire_streak.jpg" alt="Fire Streak" className="w-3 h-3 object-contain" />
              <span className="font-mono font-bold text-11 text-warning">
                {user.currentStreak}
              </span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1 flex-shrink-0 opacity-50"
              title="Complete a habit to start a streak"
            >
              <span className="text-11 text-text-tertiary">☆ Start a streak</span>
            </span>
          )}
        </div>

        {/* XP bar */}
        <div className="mt-1 flex items-center gap-1.5">
          <div
            className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={xpPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`XP: ${user.xp.toLocaleString()} / ${user.xpToNextLevel.toLocaleString()}`}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${xpPercent}%`,
                background:
                  'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))',
              }}
            />
          </div>
          <span className="font-mono text-10 text-text-tertiary flex-shrink-0">
            {xpPercent}%
          </span>
        </div>
      </div>
    </div>
  )
}
