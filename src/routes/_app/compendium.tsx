import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monstersApi } from '@/features/monsters/api/monsters.api'
import { useMonsterUiStore } from '@/features/monsters/store/monsterUi.store'
import { FilterBar, type FilterState } from '@/features/monsters/components/FilterBar'
import { MonsterListSkeleton } from '@/features/monsters/components/MonsterListSkeleton'
import { CompendiumErrorFallback } from '@/features/monsters/components/CompendiumErrorFallback'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { PillTabs, type PillTab } from '@/components/ui/PillTabs'

const MonsterList = lazy(() => import('@/features/monsters/components/MonsterList'))
const MonsterDetailSheet = lazy(() =>
  import('@/features/monsters/components/MonsterDetail').then((m) => ({
    default: m.MonsterDetailSheet,
  })),
)

export const Route = createFileRoute('/_app/compendium')({
  component: () => (
    <ErrorBoundary fallback={<CompendiumErrorFallback />}>
      <CompendiumPage />
    </ErrorBoundary>
  ),
})

function CompendiumPage() {
  const [filters, setFilters] = useState<FilterState>({
    rarity: '',
    element: '',
    role: '',
    sort: 'rarity',
    view: 'grid',
    search: '',
  })
  const selectedId = useMonsterUiStore((s) => s.selectedMonsterId)
  const setSelectedMonsterId = useMonsterUiStore((s) => s.setSelectedMonsterId)
  const [activeRealmTab, setActiveRealmTab] = useState('all')

  const { data: realmsData } = useQuery({
    queryKey: ['realms'],
    queryFn: monstersApi.getRealms,
  })

  const { data: statsData } = useQuery({
    queryKey: ['collection-stats'],
    queryFn: monstersApi.getCollectionStats,
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user-monsters', filters, activeRealmTab],
    queryFn: () =>
      monstersApi.getUserMonsters({
        rarity: filters.rarity || undefined,
        element: filters.element || undefined,
        role: filters.role || undefined,
        sort: filters.sort,
        search: filters.search || undefined,
        realmId: activeRealmTab !== 'all' ? activeRealmTab : undefined,
      }),
  })

  const realms = realmsData?.data ?? []
  const monsters = data?.data ?? []
  const total = data?.total ?? 0
  const collectionStats = statsData?.data ?? []

  const statsByRealm = useMemo(
    () => Object.fromEntries(collectionStats.map((s) => [s.realmId, s])),
    [collectionStats],
  )

  const realmTabs: PillTab[] = useMemo(() => {
    const allTab: PillTab = { id: 'all', label: 'All Realms' }
    const realmItems: PillTab[] = realms.map((realm) => {
      const stats = statsByRealm[realm.id]
      return {
        id: realm.id,
        label: realm.name,
        badge: stats ? `${stats.owned}/${stats.total}` : undefined,
      }
    })
    return [allTab, ...realmItems]
  }, [realms, statsByRealm])

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-6xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">
      <div className="flex items-center justify-end">
        <span className="font-serif text-13 text-text-secondary">
          {total.toLocaleString()} monsters
        </span>
      </div>

      <PillTabs
        tabs={realmTabs}
        activeTab={activeRealmTab}
        onChange={setActiveRealmTab}
        ariaLabel="Filter by realm"
      />

      <FilterBar filters={filters} onChange={setFilters} />

      <Suspense fallback={<MonsterListSkeleton view={filters.view} />}>
        <MonsterList
          filters={filters}
          activeRealmTab={activeRealmTab}
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          monsters={monsters}
          onRetry={refetch}
          onSelectMonster={setSelectedMonsterId}
        />
      </Suspense>

      {selectedId && (
        <Suspense fallback={null}>
          <MonsterDetailSheet
            userMonsterId={selectedId}
            onClose={() => setSelectedMonsterId(null)}
          />
        </Suspense>
      )}
    </AnimatedPage>
  )
}
