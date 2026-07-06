import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { guildApi } from '@/features/guild/api/guild.api'
import { guildKeys } from '@/features/guild/queryKeys'
import { useGuildUiStore } from '@/features/guild/store/guildUi.store'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { Card } from '@/components/ui/Card'
import { PillTabs, type PillTab } from '@/components/ui/PillTabs'

export const Route = createFileRoute('/_app/guild')({
  component: () => (
    <ErrorBoundary>
      <SanctuaryPage />
    </ErrorBoundary>
  ),
})

type SanctuaryTab = 'mine' | 'monuments' | 'heroic_lineage'

const TABS: readonly PillTab<SanctuaryTab>[] = [
  { id: 'mine',           label: 'My Sanctuary' },
  { id: 'monuments',      label: 'Monuments' },
  { id: 'heroic_lineage', label: 'Heroic Lineage' },
]

function SanctuaryPage() {
  const view = useGuildUiStore((s) => s.activeTab)
  const setView = useGuildUiStore((s) => s.setActiveTab)

  const { data: myGuildData, isLoading: sanctuaryLoading } = useQuery({
    queryKey: guildKeys.mine(),
    queryFn: guildApi.getMyGuild,
  })
  const sanctuary = myGuildData?.data ?? null

  if (sanctuaryLoading) {
    return (
      <div className="px-4 pt-24 pb-32 max-w-2xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-32 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-2xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">

      <PillTabs
        tabs={TABS}
        activeTab={view as SanctuaryTab}
        onChange={(tab) => setView(tab)}
        ariaLabel="Sanctuary views"
      />

      {/* My Sanctuary */}
      {view === 'mine' && (
        sanctuary ? (
          <div className="space-y-4">
            <Card variant="surface">
              <h2 className="font-cinzel font-bold text-18 text-text-primary">{sanctuary.name}</h2>
              <p className="text-14 text-text-secondary mt-1">{sanctuary.description}</p>
            </Card>

            {/* Monument Progress (solo — replaces Raid Boss HP) */}
            <Card variant="surface">
              <h3 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-2">Monument Progress</h3>
              <div className="flex items-center justify-between text-13 mb-1">
                <span className="text-text-secondary">Offering Progress</span>
                <span className="font-serif text-gold">
                  {sanctuary.raidBossHp.toLocaleString()} / {sanctuary.raidBossMaxHp.toLocaleString()}
                </span>
              </div>
              <div
                className="h-3 bg-bg-elevated rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={sanctuary.raidBossHp}
                aria-valuemin={0}
                aria-valuemax={sanctuary.raidBossMaxHp}
                aria-label={`Monument progress: ${sanctuary.raidBossHp} of ${sanctuary.raidBossMaxHp}`}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round((sanctuary.raidBossHp / sanctuary.raidBossMaxHp) * 100)}%`,
                    background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))',
                  }}
                />
              </div>
              <p className="text-11 text-text-tertiary mt-1">
                Complete habits to contribute offerings and unlock monument rewards.
              </p>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-48 mb-3" aria-hidden="true">🏛</p>
            <p className="font-cinzel text-16 text-text-secondary mb-1">Your Sanctuary awaits consecration.</p>
            <p className="text-14 text-text-tertiary mb-4">Build a sanctuary to unlock monuments and preserve your heroic lineage.</p>
            <button
              onClick={() => setView('heroic_lineage')}
              className="px-4 py-2 bg-gold text-bg-deep rounded-lg font-medium text-14 hover:bg-gold-bright transition-colors"
            >
              Consecrate Sanctuary
            </button>
          </div>
        )
      )}

      {/* Monuments — replaces Browse Guilds */}
      {view === 'monuments' && (
        <div className="space-y-3">
          <div className="text-center py-12">
            <p className="text-48 mb-3" aria-hidden="true">🗿</p>
            <p className="font-cinzel text-16 text-text-secondary mb-1">
              Monuments are awakened through offerings.
            </p>
            <p className="text-14 text-text-tertiary">
              Complete habits and battles to gather offerings. Each monument unlocks unique rewards.
            </p>
          </div>
        </div>
      )}

      {/* Heroic Lineage — replaces Create Guild */}
      {view === 'heroic_lineage' && (
        <Card variant="surface" className="space-y-4">
          <h2 className="font-cinzel font-semibold text-16 text-text-primary">Heroic Lineage</h2>
          <p className="text-13 text-text-secondary">
            Record the names and deeds of your greatest monsters. Retired monsters live on in the lineage, granting passive bonuses.
          </p>

          <div className="text-center py-8">
            <p className="text-32 mb-2" aria-hidden="true">📜</p>
            <p className="text-13 text-text-tertiary">
              No legends inscribed yet. Retire a max-bond monster to begin your lineage.
            </p>
          </div>
        </Card>
      )}
    </AnimatedPage>
  )
}
