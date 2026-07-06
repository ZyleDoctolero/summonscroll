import { cn } from '@/lib/utils'
import type { BattleMode } from '@/types'
import type { BattleState, BattleRewards } from '../api/battles.api'
import { BATTLE_MODE_LABELS } from '../constants'

export interface BattleOutcomeProps {
  battleState: BattleState
  rewards: BattleRewards | null
  enemyName: string
  mode: BattleMode
  floor: number
  logIndex: number
  onNextLogChunk: () => void
  onClose: () => void
}

export function BattleOutcome({
  battleState,
  rewards,
  enemyName,
  mode,
  floor,
  logIndex,
  onNextLogChunk,
  onClose,
}: BattleOutcomeProps) {
  const visibleLog = battleState.log.slice(0, logIndex + 1)
  const allShown = logIndex >= battleState.log.length - 1

  return (
    <div className="fixed inset-0 z-modal bg-bg-overlay flex items-center justify-center p-4">
      <div
        className="bg-bg-surface border border-border rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Battle results"
      >
        <div className="text-center">
          <p
            className={cn(
              'font-cinzel font-bold text-32',
              battleState.playerWon ? 'text-gold-bright' : 'text-danger',
            )}
          >
            {battleState.playerWon ? '⚔ VICTORY' : '💀 DEFEAT'}
          </p>
          <p className="text-14 text-text-secondary mt-1">
            {BATTLE_MODE_LABELS[mode]} — Floor {floor} — {battleState.round} rounds
          </p>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-12 text-text-secondary mb-1">
              <span>Your Team</span>
              <span className="font-mono">
                {battleState.playerHp.toLocaleString()} / {battleState.playerMaxHp.toLocaleString()}
              </span>
            </div>
            {(() => {
              const pct = Math.max(0, Math.round((battleState.playerHp / battleState.playerMaxHp) * 100))
              const isCritical = pct <= 25
              return (
                <div className="relative">
                  <div
                    className="h-3 bg-bg-elevated rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={battleState.playerHp}
                    aria-valuemin={0}
                    aria-valuemax={battleState.playerMaxHp}
                    aria-label={`Player HP: ${pct}%`}
                  >
                    <div
                      className={cn('h-full rounded-full transition-all', isCritical ? 'bg-danger' : 'bg-success')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="absolute right-1 top-0 text-9 font-mono font-bold text-white/80 leading-[12px]">
                    {pct}%
                  </span>
                </div>
              )
            })()}
          </div>

          <div>
            <div className="flex justify-between text-12 text-text-secondary mb-1">
              <span>{enemyName}</span>
              <span className="font-mono">
                {battleState.enemyHp.toLocaleString()} / {battleState.enemyMaxHp.toLocaleString()}
              </span>
            </div>
            {(() => {
              const pct = Math.max(0, Math.round((battleState.enemyHp / battleState.enemyMaxHp) * 100))
              return (
                <div className="relative">
                  <div
                    className="h-3 bg-bg-elevated rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={battleState.enemyHp}
                    aria-valuemin={0}
                    aria-valuemax={battleState.enemyMaxHp}
                    aria-label={`Enemy HP: ${pct}%`}
                  >
                    <div
                      className="h-full rounded-full transition-all bg-danger"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="absolute right-1 top-0 text-9 font-mono font-bold text-white/80 leading-[12px]">
                    {pct}%
                  </span>
                </div>
              )
            })()}
          </div>
        </div>

        <div
          className="bg-bg-elevated rounded-lg p-3 max-h-48 overflow-y-auto space-y-1"
          aria-label="Battle log"
          aria-live="polite"
        >
          {visibleLog.map((entry, i) => (
            <div
              key={i}
              className={cn(
                'text-12 flex items-center gap-2',
                entry.actor === 'player' ? 'text-text-primary' : 'text-danger',
              )}
            >
              <span className="font-mono text-text-tertiary w-8 flex-shrink-0">
                R{entry.round}
              </span>
              <span>{entry.action}</span>
              <span className="font-mono font-bold ml-auto flex-shrink-0">
                -{entry.damage.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {!allShown ? (
          <button
            type="button"
            onClick={onNextLogChunk}
            className="w-full py-2 rounded-lg text-14 text-text-secondary bg-bg-elevated hover:bg-bg-hover transition-colors"
          >
            Next →
          </button>
        ) : rewards ? (
          <div className="bg-bg-elevated rounded-lg p-4 space-y-2" aria-label="Battle rewards">
            <p className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider">
              Rewards
            </p>
            <div className="flex gap-4 text-14">
              {rewards.spiritCrystals > 0 && (
                <span className="font-mono text-gold">+{rewards.spiritCrystals} 💎</span>
              )}
              {rewards.voidShards > 0 && (
                <span className="font-mono text-void">+{rewards.voidShards} 🔷</span>
              )}
              {rewards.xp > 0 && (
                <span className="font-mono text-text-secondary">+{rewards.xp} XP</span>
              )}
              {!rewards.spiritCrystals && !rewards.voidShards && !rewards.xp && (
                <span className="text-text-tertiary">No rewards</span>
              )}
            </div>
          </div>
        ) : null}

        {allShown && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-14 transition-all',
              'bg-gold text-bg-deep hover:bg-gold-bright',
              'focus:outline-none focus:ring-2 focus:ring-gold/60',
            )}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
