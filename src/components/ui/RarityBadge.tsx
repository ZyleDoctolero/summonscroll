import { cn } from '@/lib/utils'
import type { Rarity } from '@/types'

const RARITY_LABELS: Record<Rarity, string> = {
  common:    'Common',
  uncommon:  'Uncommon',
  rare:      'Rare',
  elite:     'Elite',
  epic:      'Epic',
  legendary: 'Legendary',
  mythic:    'Mythic',
  ex:        'EX',
}

const RARITY_SYMBOLS: Record<Rarity, string> = {
  common:    '◇',
  uncommon:  '◆',
  rare:      '★',
  elite:     '◈',
  epic:      '⬟',
  legendary: '⬡',
  mythic:    '⬢',
  ex:        '✵',
}

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: 'text-10 px-1.5 py-0.5',
  sm: 'text-11 px-2 py-0.5',
  md: 'text-12 px-2.5 py-1',
  lg: 'text-14 px-3 py-1',
}

interface RarityBadgeProps {
  rarity: Rarity
  size?: BadgeSize
  className?: string
  showSymbol?: boolean
}

export function RarityBadge({
  rarity,
  size = 'sm',
  className,
  showSymbol = true,
}: RarityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill font-medium uppercase tracking-[0.08em] border',
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        color: `var(--rarity-${rarity})`,
        backgroundColor: `color-mix(in srgb, var(--rarity-${rarity}) 15%, transparent)`,
        borderColor: `var(--rarity-${rarity})`,
        boxShadow: rarity !== 'common' ? `var(--glow-${rarity})` : undefined,
      }}
      aria-label={`${RARITY_LABELS[rarity]} rarity`}
    >
      {showSymbol && (
        <span aria-hidden="true">{RARITY_SYMBOLS[rarity]}</span>
      )}
      {RARITY_LABELS[rarity]}
    </span>
  )
}
