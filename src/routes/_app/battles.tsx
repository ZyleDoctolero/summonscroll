import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monstersApi } from '@/features/monsters/api/monsters.api'
import { calculateTeamPower } from '@/features/battles/powerCalc'
import { BattleScreen } from '@/features/battles/components/BattleScreen'
import { useBattleUiStore } from '@/features/battles/store/battleUi.store'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { Card } from '@/components/ui/Card'
import { LazyImage } from '@/components/ui/LazyImage'
import { cn } from '@/lib/utils'
import type { BattleMode } from '@/types'

export const Route = createFileRoute('/_app/battles')({
  component: () => (
    <ErrorBoundary>
      <BattlesPage />
    </ErrorBoundary>
  ),
})

const BATTLE_MODES = [
  {
    id: 'dungeon',
    name: 'Dungeon Crawl',
    icon: '🏰',
    desc: 'Fight through procedurally generated dungeons for loot.',
    unlockLevel: 1,
  },
  {
    id: 'chaos_tower',
    name: 'Chaos Tower',
    icon: '🗼',
    desc: '100 floors of escalating difficulty. How far can you climb?',
    unlockLevel: 5,
  },
  {
    id: 'abyssal_rift',
    name: 'Abyssal Rift',
    icon: '🌀',
    desc: 'Challenge solo rifts with escalating modifiers for exclusive loot.',
    unlockLevel: 10,
  },
  {
    id: 'event',
    name: 'Event Battle',
    icon: '🌟',
    desc: 'Limited-time event battles with exclusive rewards.',
    unlockLevel: 1,
  },
] as const

function BattlesPage() {
  const [chaosFloor] = useState(1)
  const activeBattle = useBattleUiStore((s) => s.activeBattle)
  const setActiveBattle = useBattleUiStore((s) => s.setActiveBattle)

  const { data: teamData } = useQuery({
    queryKey: ['user-monsters', { onTeam: true }],
    queryFn: () => monstersApi.getUserMonsters(),
  })

  const team = useMemo(() => (teamData?.data ?? []).filter((um) => um.isOnTeam), [teamData])
  const teamPower = useMemo(() => calculateTeamPower(team), [team])
  const hasTeam = team.length >= 3

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-2xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">

      {/* Team power display */}
      <Card variant="surface">
        <div className="flex items-center justify-between">
          <span className="text-14 text-text-secondary">Team Power</span>
          <span className="font-serif font-bold text-20 text-gold">
            {teamPower.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {team.length > 0 ? (
            team.map((um) => (
              <div
                key={um.id}
                className="w-8 h-8 rounded-full overflow-hidden bg-bg-elevated border border-border"
                title={um.monster.name}
              >
                {um.monster.artUrl ? (
                  <LazyImage src={um.monster.artUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-12 opacity-40">👾</div>
                )}
              </div>
            ))
          ) : (
            <p className="text-13 text-text-tertiary">
              No team assigned.{' '}
              <Link to="/island" className="text-gold hover:text-gold-bright">
                Build your team →
              </Link>
            </p>
          )}
        </div>
      </Card>

      {/* Chaos Tower progress */}
      <Card variant="surface">
        <div className="flex items-center justify-between mb-2">
          <span className="font-cinzel font-semibold text-14 text-text-primary">
            Chaos Tower
          </span>
          <span className="font-serif text-13 text-gold">
            Floor {chaosFloor} / 100
          </span>
        </div>
        <div
          className="h-2 bg-bg-elevated rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={chaosFloor}
          aria-valuemin={1}
          aria-valuemax={100}
          aria-label={`Chaos Tower: Floor ${chaosFloor} of 100`}
        >
          <div
            className="h-full rounded-full bg-rarity-mythic transition-all"
            style={{ width: `${chaosFloor}%` }}
          />
        </div>
      </Card>

      {/* No team warning */}
      {!hasTeam && (
        <div
          className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-13"
          role="alert"
        >
          Build a team of 3+ monsters to enter battle.{' '}
          <Link to="/island" className="underline">Build Team →</Link>
        </div>
      )}

      {/* Battle mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BATTLE_MODES.map((mode) => (
          <button
            key={mode.id}
            disabled={!hasTeam}
            onClick={() => setActiveBattle({ mode: mode.id as BattleMode, floor: mode.id === 'chaos_tower' ? chaosFloor : 1 })}
            className={cn(
              'bg-bg-surface rounded-lg p-4 border border-border text-left transition-all',
              'hover:bg-bg-hover hover:border-gold/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-gold/40',
            )}
            aria-label={`${mode.name}: ${mode.desc}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-24" aria-hidden="true">{mode.icon}</span>
              <span className="font-cinzel font-semibold text-14 text-text-primary">
                {mode.name}
              </span>
            </div>
            <p className="text-12 text-text-secondary">{mode.desc}</p>
          </button>
        ))}
      </div>

      {/* Battle screen overlay */}
      {activeBattle && team.length > 0 && (
        <BattleScreen
          team={team}
          mode={activeBattle.mode}
          floor={activeBattle.floor}
          onClose={() => setActiveBattle(null)}
        />
      )}
    </AnimatedPage>
  )
}
