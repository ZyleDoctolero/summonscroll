import { cn } from '@/lib/utils'
import { LazyImage } from '@/components/ui/LazyImage'
import { ActivityHalo } from './ActivityHalo'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { UserMonster } from '@/types'

interface IslandSpriteProps {
  userMonster: UserMonster
  /** Whether the monster's linked habit was completed today */
  habitCompletedToday?: boolean
  /** Streak health 0–100; 0 = FATIGUED */
  streakHealth?: number
  onClick?: () => void
}

/** Determine idle animation class based on bond % */
function getIdleClass(bondPercent: number, reducedMotion: boolean): string {
  if (reducedMotion) return ''
  if (bondPercent >= 76) return 'animate-bounce'  // excited, waves
  if (bondPercent >= 26) return 'animate-pulse'    // roams, glances
  return ''                                         // sits still
}

/** Determine visual filter based on streak health and bond state */
function getFilter(streakHealth: number, bondPercent: number): string {
  // FATIGUED: streak broken — greyscale + dim
  if (streakHealth === 0) return 'grayscale(1) brightness(0.5)'
  // At risk: low streak health — desaturate
  if (streakHealth < 33)  return 'saturate(0.4) sepia(0.3)'
  if (streakHealth < 66)  return 'saturate(0.7)'
  // Healthy — use bond-based saturation
  if (bondPercent < 26)   return 'saturate(0.6)'
  return 'none'
}

export function MonsterIslandSprite({
  userMonster,
  habitCompletedToday = false,
  streakHealth = 100,
  onClick,
}: IslandSpriteProps) {
  const { monster, bondPercent } = userMonster
  const reducedMotion = useReducedMotion()
  const idleClass = getIdleClass(bondPercent, reducedMotion)
  const filter = getFilter(streakHealth, bondPercent)
  const isFatigued = streakHealth === 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-lg',
      )}
      aria-label={`${monster.name} — Bond ${bondPercent}%${isFatigued ? ' (Fatigued)' : ''}`}
    >
      {/* Sprite */}
      <div
        className={cn(
          'w-16 h-16 rounded-full overflow-hidden bg-bg-elevated border-2 transition-all',
          idleClass,
          isFatigued
            ? 'border-danger'
            : 'border-transparent group-hover:border-gold/40',
        )}
        style={{
          filter,
          boxShadow:
            !isFatigued && monster.rarity !== 'common'
              ? `var(--glow-${monster.rarity})`
              : undefined,
        }}
      >
        {monster.artUrl ? (
          <LazyImage
            src={monster.artUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-24 opacity-40">
            👾
          </div>
        )}

        {/* Red crack overlay when FATIGUED */}
        {isFatigued && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(224,82,82,0.25) 4px, rgba(224,82,82,0.25) 5px)',
            }}
          />
        )}
      </div>

      {/* Activity halo dot */}
      <ActivityHalo isActive={habitCompletedToday} />

      {/* FATIGUED badge */}
      {isFatigued && (
        <span
          className="absolute -top-1 -right-1 bg-danger text-white text-9 font-bold rounded-pill px-1 py-0.5 uppercase tracking-wide"
          aria-label="Monster is fatigued"
        >
          Fatigued
        </span>
      )}

      {/* Name */}
      <span className="text-10 font-cinzel text-text-secondary truncate max-w-[72px] text-center">
        {monster.name}
      </span>
    </button>
  )
}
