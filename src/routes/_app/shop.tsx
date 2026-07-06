import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { Card } from '@/components/ui/Card'
import { UnderlineTabs, type UnderlineTab } from '@/components/ui/UnderlineTabs'
import { shopApi } from '@/features/shop/api/shop.api'
import { shopKeys } from '@/features/shop/queryKeys'
import {
  useShopUiStore,
  type ShopCategoryTab,
} from '@/features/shop/store/shopUi.store'
import { useUiStore } from '@/stores/uiStore'
import { LazyImage } from '@/components/ui/LazyImage'
import type { ShopItem } from '@/types'

export const Route = createFileRoute('/_app/shop')({
  component: () => (
    <ErrorBoundary>
      <ShopPage />
    </ErrorBoundary>
  ),
})

const TABS: readonly UnderlineTab<ShopCategoryTab>[] = [
  { id: 'daily',    label: 'Daily',    icon: '📅' },
  { id: 'featured', label: 'Featured', icon: '⭐' },
  { id: 'packs',    label: 'Packs',    icon: '📦' },
]

const CURRENCY_ICONS: Record<string, string> = {
  spiritCrystals: '💎',
  voidShards:     '🔷',
  pactSeals:      '🔑',
  gold:           '🪙',
}

function ShopPage() {
  const activeCategoryTab = useShopUiStore((s) => s.activeCategoryTab)
  const setActiveCategoryTab = useShopUiStore((s) => s.setActiveCategoryTab)
  const queryClient = useQueryClient()
  const { addToast } = useUiStore()
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: shopKeys.items(activeCategoryTab),
    queryFn: () => shopApi.getItems(activeCategoryTab),
  })

  const purchaseMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => shopApi.purchase(itemId),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Purchase successful!' })
      void queryClient.invalidateQueries({ queryKey: shopKeys.all })
      setConfirmItem(null)
    },
    onError: (err) => {
      addToast({
        type: 'error',
        title: 'Purchase failed',
        message: err instanceof Error ? err.message : 'Please try again.',
      })
      setConfirmItem(null)
    },
  })

  const items = data?.data ?? []

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-2xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">

      <UnderlineTabs
        tabs={TABS}
        activeTab={activeCategoryTab}
        onChange={setActiveCategoryTab}
        ariaLabel="Shop categories"
      />

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-20 w-full rounded-lg" />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-8 text-danger text-14">
          Failed to load shop items.
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-48 mb-2" aria-hidden="true">🏪</p>
          <p className="font-cinzel text-16 text-text-secondary mb-1">
            The shop is restocking.
          </p>
          <p className="text-14 text-text-tertiary">Check back later for new items.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            onPurchase={() => setConfirmItem(item)}
            isPurchasing={purchaseMutation.isPending && confirmItem?.id === item.id}
          />
        ))}
      </div>

      {/* Purchase confirmation modal */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-purchase-title"
        >
          <div className="bg-bg-surface border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 id="confirm-purchase-title" className="font-cinzel font-semibold text-16 text-text-primary mb-3">
              Confirm Purchase
            </h3>
            <p className="text-14 text-text-secondary mb-2">
              Buy <strong className="text-text-primary">{confirmItem.name}</strong>?
            </p>
            <p className="text-13 text-gold font-serif font-bold mb-4">
              {CURRENCY_ICONS[confirmItem.costCurrency] ?? '💰'} {confirmItem.cost.toLocaleString()} {confirmItem.costCurrency === 'spiritCrystals' ? 'Spirit Crystals' : confirmItem.costCurrency === 'voidShards' ? 'Void Shards' : confirmItem.costCurrency}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmItem(null)}
                disabled={purchaseMutation.isPending}
                className="flex-1 py-2.5 rounded-md bg-bg-elevated text-text-secondary hover:bg-bg-hover transition-colors text-14 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => purchaseMutation.mutate({ itemId: confirmItem.id })}
                disabled={purchaseMutation.isPending}
                className="flex-1 py-2.5 rounded-md bg-gold text-bg-deep hover:bg-gold-bright transition-colors text-14 font-medium disabled:opacity-50"
              >
                {purchaseMutation.isPending ? 'Buying…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  )
}

interface ShopItemCardProps {
  item: ShopItem
  onPurchase: () => void
  isPurchasing: boolean
}

function ShopItemCard({ item, onPurchase, isPurchasing }: ShopItemCardProps) {
  const isLimited = item.limitedUntil !== null
  const timeLeft = isLimited
    ? Math.max(0, new Date(item.limitedUntil!).getTime() - Date.now())
    : null

  return (
    <Card
      variant="surface"
      className="flex items-center gap-3"
      aria-label={item.name}
    >
      {/* Art */}
      <div className="w-14 h-14 rounded-md bg-bg-elevated flex-shrink-0 flex items-center justify-center overflow-hidden">
        {item.artUrl ? (
          <LazyImage src={item.artUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-24 opacity-40" aria-hidden="true">📦</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-cinzel font-semibold text-14 text-text-primary truncate">
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="text-11 text-text-tertiary">×{item.quantity}</span>
          )}
        </div>
        <p className="text-12 text-text-secondary mt-0.5 truncate">{item.description}</p>
        {isLimited && timeLeft !== null && (
          <p className="text-11 text-warning mt-0.5">
            ⏱ Limited time
          </p>
        )}
      </div>

      {/* Price + buy */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="font-serif font-bold text-13 text-gold">
          {CURRENCY_ICONS[item.costCurrency] ?? '💰'} {item.cost.toLocaleString()}
        </span>
        <button
          onClick={onPurchase}
          disabled={isPurchasing}
          className="px-3 py-1 bg-gold text-bg-deep rounded-md text-12 font-medium hover:bg-gold-bright transition-colors disabled:opacity-50"
          aria-label={`Buy ${item.name} for ${item.cost} ${item.costCurrency}`}
        >
          Buy
        </button>
      </div>
    </Card>
  )
}
