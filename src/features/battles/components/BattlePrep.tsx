import { LazyImage } from '@/components/ui/LazyImage'
import { cn } from '@/lib/utils'
import type { BattleMode, UserMonster } from '@/types'
import { BATTLE_MODE_LABELS } from '../constants'

export interface BattlePrepProps {
  team: UserMonster[]
  mode: BattleMode
  floor: number
  isPending: boolean
  onStart: () => void
  onClose: () => void
}

export function BattlePrep({
  team,
  mode,
  floor,
  isPending,
  onStart,
  onClose,
}: BattlePrepProps) {
  return (
    <div className="fixed inset-0 z-modal bg-bg-overlay flex items-center justify-center p-4">
      <div
        className="bg-bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4"
        role="dialog"
        aria-modal="true"
        aria-label="Battle preparation"
      >
        <h2 className="font-cinzel font-bold text-20 text-text-primary">
          {BATTLE_MODE_LABELS[mode]}
        </h2>
        <p className="text-14 text-text-secondary">
          Floor {floor} — Team of {team.length} monsters
        </p>

        <div className="flex gap-2 flex-wrap">
          {team.map((um) => (
            <div
              key={um.id}
              className="flex flex-col items-center gap-1"
              title={um.monster.name}
            >
              <div
                className="w-12 h-12 rounded-full overflow-hidden bg-bg-elevated border border-border"
                style={{
                  boxShadow: `var(--glow-${um.monster.rarity})`,
                }}
              >
                {um.monster.artUrl ? (
                  <LazyImage
                    src={um.monster.artUrl}
                    alt={um.monster.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-20 opacity-40">
                    👾
                  </div>
                )}
              </div>
              <span className="text-9 font-cinzel text-text-tertiary truncate max-w-[52px] text-center">
                {um.monster.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={isPending}
            className={cn(
              'flex-1 py-3 rounded-lg font-medium text-14 transition-all',
              'bg-gold text-bg-deep hover:bg-gold-bright',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-gold/60',
            )}
          >
            {isPending ? 'Battling…' : '⚔ Start Battle'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-lg text-14 text-text-secondary bg-bg-elevated hover:bg-bg-hover transition-colors"
            aria-label="Cancel battle"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
