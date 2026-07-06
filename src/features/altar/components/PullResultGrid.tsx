import { RarityBadge } from '@/components/ui/RarityBadge'
import { MonsterArtDisplay } from './MonsterArtDisplay'
import type { PullResult, Rarity } from '@/types'

interface PullResultGridProps {
  results: PullResult[]
  onClose: () => void
}

const RARITY_ORDER: Record<Rarity, number> = {
  ex: 7, mythic: 6, legendary: 5, epic: 4, elite: 3, rare: 2, uncommon: 1, common: 0,
}

export function PullResultGrid({ results, onClose }: PullResultGridProps) {
  const sorted = [...results].sort(
    (a, b) => RARITY_ORDER[b.monster.rarity] - RARITY_ORDER[a.monster.rarity],
  )

  return (
    <div
      className="fixed inset-0 z-reveal bg-bg-overlay flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Pull results"
    >
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="font-cinzel font-bold text-24 text-text-primary text-center mb-4">
          Summon Results
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
          {sorted.map((result, i) => (
            <div
              key={i}
              className="bg-bg-surface rounded-lg p-2 border text-center"
              style={{
                borderColor: `var(--rarity-${result.monster.rarity})`,
                boxShadow: result.monster.rarity !== 'common'
                  ? `var(--glow-${result.monster.rarity})`
                  : undefined,
              }}
            >
              <MonsterArtDisplay monster={result.monster} size="sm" />
              <p className="font-cinzel text-11 text-text-primary mt-1 truncate">
                {result.monster.name}
              </p>
              <RarityBadge rarity={result.monster.rarity} size="xs" className="mt-1" />
              {result.isNew && (
                <p className="text-success text-10 mt-0.5">New!</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={onClose}
          className="w-full py-3 bg-gold text-bg-deep rounded-lg font-cinzel font-semibold text-16 hover:bg-gold-bright transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
