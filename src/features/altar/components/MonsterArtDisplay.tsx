import { LazyImage } from '@/components/ui/LazyImage'
import { cn } from '@/lib/utils'
import type { Rarity } from '@/types'

export interface MonsterArtDisplayProps {
  monster: { name: string; artUrl: string | null; rarity: Rarity; element: string }
  size: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  exGlow?: boolean
}

const ART_SIZES = {
  sm:  'w-20 h-20',
  md:  'w-32 h-32',
  lg:  'w-48 h-48',
  xl:  'w-64 h-64',
}

export function MonsterArtDisplay({ monster, size, glow, exGlow }: MonsterArtDisplayProps) {
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden bg-bg-elevated flex items-center justify-center',
        ART_SIZES[size],
      )}
      style={{
        boxShadow: exGlow
          ? 'var(--glow-ex)'
          : glow && monster.rarity !== 'common'
          ? `var(--glow-${monster.rarity})`
          : undefined,
      }}
    >
      {monster.artUrl ? (
        <LazyImage
          src={monster.artUrl}
          alt={monster.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-48 opacity-40" aria-hidden="true">👾</span>
      )}
    </div>
  )
}
