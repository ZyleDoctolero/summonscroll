import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useCallback } from 'react'
import { useBanners } from '@/features/altar/hooks/useBanners'
import { usePullBanner } from '@/features/altar/hooks/usePullBanner'
import { BannerCard } from '@/features/altar/components/BannerCard'
import { SummonReveal } from '@/features/altar/components/SummonReveal'
import { EmptyBanners } from '@/features/altar/components/EmptyBanners'
import { AltarErrorFallback } from '@/features/altar/components/AltarErrorFallback'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { PillTabs, type PillTab } from '@/components/ui/PillTabs'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import type { BannerType, PullResult } from '@/types'

export const Route = createFileRoute('/_app/altar')({
  component: () => (
    <ErrorBoundary fallback={<AltarErrorFallback />}>
      <AltarPage />
    </ErrorBoundary>
  ),
})

type BannerTab = 'all' | BannerType

const TABS: readonly PillTab<BannerTab>[] = [
  { id: 'all',       label: 'All' },
  { id: 'standard',  label: 'Standard' },
  { id: 'featured',  label: 'Featured' },
  { id: 'streak',    label: 'Streak' },
  { id: 'pact_seal', label: 'Pact Seal' },
  { id: 'event',     label: 'Event' },
]

function AltarPage() {
  const [activeTab, setActiveTab] = useState<BannerTab>('all')
  const [revealResults, setRevealResults] = useState<PullResult[] | null>(null)
  const { addToast } = useUiStore()
  const user = useUserStore((s) => s.user)

  const { data: banners = [], isLoading, isError } = useBanners()

  const pullMutation = usePullBanner()

  const handlePull = useCallback((bannerId: string, count: 1 | 10) => {
    pullMutation.mutate(
      { bannerId, count },
      {
        onSuccess: (res) => setRevealResults(res.data.results),
        onError: (err) =>
          addToast({
            type: 'error',
            title: 'Pull failed',
            message: err instanceof Error ? err.message : 'Please try again.',
          }),
      },
    )
  }, [pullMutation, addToast])

  const filtered = useMemo(() =>
    activeTab === 'all'
      ? banners
      : banners.filter((b) => b.bannerType === activeTab),
  [activeTab, banners])

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-4xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">

      <PillTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Banner types"
      />

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-64 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-danger text-14">Failed to load banners. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && <EmptyBanners />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((banner) => {
          const userCurrency = user
            ? (user[banner.pullCurrency as keyof typeof user] as number ?? 0)
            : 0
          const canAfford = userCurrency >= banner.pullCost

          return (
            <BannerCard
              key={banner.id}
              banner={banner}
              onPull={(count: 1 | 10) => handlePull(banner.id, count)}
              isPending={pullMutation.isPending}
              canAfford={canAfford}
            />
          )
        })}
      </div>

      {revealResults && (
        <SummonReveal
          results={revealResults}
          onClose={() => setRevealResults(null)}
        />
      )}
    </AnimatedPage>
  )
}
