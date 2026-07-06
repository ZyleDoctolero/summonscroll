import { cn } from '@/lib/utils'
import type { Rarity } from '@/types'

const MILESTONES = [
  { percent: 25, label: 'Skill 2 unlock' },
  { percent: 50, label: 'Skill 3 unlock' },
  { percent: 100, label: 'Passive unlock' },
]

interface BondBarProps {
  bondPercent: number
  rarity: Rarity
  className?: string
}

export function BondBar({ bondPercent, rarity, className }: BondBarProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-12">
        <span className="text-text-secondary font-medium">Bond Progress</span>
        <span className="font-mono font-bold" style={{ color: `var(--rarity-${rarity})` }}>
          {bondPercent}%
        </span>
      </div>

      {/* Bar with milestone markers */}
      <div className="relative h-3 bg-bg-elevated rounded-full overflow-visible">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${bondPercent}%`,
            backgroundColor: `var(--rarity-${rarity})`,
            boxShadow: bondPercent > 0 ? `var(--glow-${rarity})` : undefined,
          }}
          role="progressbar"
          aria-valuenow={bondPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Bond: ${bondPercent}%`}
        />

        {/* Milestone markers */}
        {MILESTONES.map((m) => {
          const reached = bondPercent >= m.percent
          return (
            <div
              key={m.percent}
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${m.percent}%` }}
              aria-hidden="true"
            >
              {/* Marker line */}
              <div
                className="w-0.5 h-4 rounded-full transition-colors duration-500"
                style={{
                  backgroundColor: reached ? 'var(--color-gold)' : 'var(--color-bg-deep)',
                  boxShadow: reached ? '0 0 4px var(--color-gold)' : 'none',
                }}
                title={`${m.label}${reached ? ' (unlocked)' : ''}`}
              />
              {/* Gold dot at milestone when reached */}
              {reached && (
                <div
                  className="absolute -top-1 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-gold)',
                    boxShadow: '0 0 6px var(--color-gold)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Milestone labels */}
      <div className="relative h-4">
        {MILESTONES.map((m) => (
          <span
            key={m.percent}
            className="absolute text-10 -translate-x-1/2 transition-colors duration-500"
            style={{
              left: `${m.percent}%`,
              color: bondPercent >= m.percent ? 'var(--color-gold)' : 'var(--color-text-disabled)',
              fontWeight: bondPercent >= m.percent ? 700 : 400,
            }}
            title={m.label}
          >
            {m.percent}%
          </span>
        ))}
      </div>
    </div>
  )
}
