import { motion } from 'framer-motion'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { ElementIcon } from '@/components/ui/ElementIcon'
import { LazyImage } from '@/components/ui/LazyImage'
import { AwakeningStars } from './AwakeningStars'
import { cn } from '@/lib/utils'
import { monsterCardVariants } from '../animations/card.variants'
import type { UserMonster, MonsterRole } from '@/types'

const ROLE_ICONS: Record<MonsterRole, string> = {
  attacker: '⚔',
  tank:     '🛡',
  healer:   '💚',
  support:  '⭐',
  debuffer: '☠',
}

const ROLE_LABELS: Record<MonsterRole, string> = {
  attacker: 'Attacker',
  tank:     'Tank',
  healer:   'Healer',
  support:  'Support',
  debuffer: 'Debuffer',
}

interface MonsterCardProps {
  userMonster: UserMonster
  onClick?: () => void
  view?: 'grid' | 'list'
  /** When true, renders a dark silhouette with a ? badge (unowned monster) */
  isOwned?: boolean
}

/** Determine visual state based on bond/habit health */
function getBondVisualState(bondPercent: number): { filter: string } {
  if (bondPercent >= 76) return { filter: 'none' }
  if (bondPercent >= 51) return { filter: 'saturate(0.7)' }
  if (bondPercent >= 26) return { filter: 'saturate(0.4) sepia(0.2)' }
  return { filter: 'grayscale(1)' }
}

function handleKeyDown(e: React.KeyboardEvent, onClick?: () => void) {
  if ((e.key === 'Enter' || e.key === ' ') && onClick) {
    e.preventDefault()
    onClick()
  }
}

export function MonsterCard({ userMonster, onClick, view = 'grid', isOwned = true }: MonsterCardProps) {
  const { monster, level, bondPercent, awakeningStage } = userMonster
  const { filter } = getBondVisualState(bondPercent)
  const hasGlow = monster.rarity !== 'common'

  if (view === 'list') {
    return (
      <motion.article
        variants={monsterCardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ backgroundColor: 'var(--color-bg-hover)' }}
        className={cn(
          'flex items-center gap-3 bg-bg-surface rounded-lg px-3 py-2.5 border border-border cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep',
        )}
        style={{
          boxShadow: hasGlow ? `var(--glow-${monster.rarity})` : undefined,
        }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, onClick)}
        aria-label={`${monster.name}, ${monster.rarity} ${monster.role}`}
      >
        {/* Art */}
        <div
          className="w-16 h-16 rounded-md overflow-hidden bg-bg-elevated flex-shrink-0"
          style={{ filter }}
        >
          {monster.artUrl ? (
            <LazyImage src={monster.artUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-24 opacity-40">
              👾
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-semibold text-14 text-text-primary truncate">
              {monster.name}
            </span>
            <RarityBadge rarity={monster.rarity} size="xs" />
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-12 text-text-secondary">
            <span>Lvl {level}</span>
            <span aria-hidden="true">·</span>
            <span>Bond {bondPercent}%</span>
          </div>
        </div>

        <ElementIcon element={monster.element} size="sm" />
        <span
          className="text-14 flex-shrink-0"
          aria-label={ROLE_LABELS[monster.role]}
          title={ROLE_LABELS[monster.role]}
        >
          {ROLE_ICONS[monster.role]}
        </span>
      </motion.article>
    )
  }

  // Grid view — uses whileHover variant instead of useState
  return (
    <motion.article
      variants={monsterCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={cn(
        'bg-bg-surface rounded-lg overflow-hidden border cursor-pointer',
        'hover:brightness-105',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep',
      )}
      style={{
        borderColor: `var(--rarity-${monster.rarity})`,
        borderWidth: '1px',
        boxShadow: hasGlow ? `var(--glow-${monster.rarity})` : undefined,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => handleKeyDown(e, onClick)}
      aria-label={`${monster.name}, ${monster.rarity} ${monster.role}, level ${level}`}
    >
      {/* Art */}
      <div className="relative w-full aspect-square bg-bg-elevated overflow-hidden">
        <div
          className="w-full h-full"
          style={{ filter: !isOwned ? 'brightness(0)' : filter }}
        >
          {monster.artUrl ? (
            <LazyImage
              src={monster.artUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-48 opacity-30">
              👾
            </div>
          )}
        </div>

        {/* Unowned silhouette overlay */}
        {!isOwned && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-32 font-bold text-text-disabled opacity-60"
              aria-hidden="true"
            >
              ?
            </span>
          </div>
        )}

        {/* Role icon — bottom left */}
        <div
          className="absolute bottom-1.5 left-1.5 bg-bg-overlay rounded-md px-1.5 py-0.5 text-12"
          aria-label={ROLE_LABELS[monster.role]}
          title={ROLE_LABELS[monster.role]}
        >
          {ROLE_ICONS[monster.role]}
        </div>

        {/* Element icon — bottom right */}
        <div className="absolute bottom-1.5 right-1.5 bg-bg-overlay rounded-md px-1.5 py-0.5">
          <ElementIcon element={monster.element} size="sm" />
        </div>

        {/* Awakening stars */}
        {awakeningStage > 0 && (
          <div className="absolute top-1.5 right-1.5">
            <AwakeningStars stage={awakeningStage} size="sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="font-cinzel font-semibold text-13 text-text-primary truncate">
          {monster.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-11 text-text-secondary">
            Lvl {level}
          </span>
          <span className="font-mono text-11 text-text-secondary">
            Bond {bondPercent}%
          </span>
        </div>

        {/* Bond bar */}
        <div
          className="mt-1.5 h-1 bg-bg-elevated rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={bondPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Bond: ${bondPercent}%`}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${bondPercent}%`,
              backgroundColor: `var(--rarity-${monster.rarity})`,
            }}
          />
        </div>

        <div className="mt-1.5">
          <RarityBadge rarity={monster.rarity} size="xs" />
        </div>
      </div>
    </motion.article>
  )
}
