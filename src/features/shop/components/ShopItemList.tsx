import { motion } from 'framer-motion'
import { staggerChildren } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { useShopItems, usePurchaseItem } from '../hooks/useShop'
import { ShopItemCard } from './ShopItemCard'
import type { ShopCategoryTab } from '../store/shopUi.store'

export interface ShopItemListProps {
  tab: ShopCategoryTab
  className?: string
}

export function ShopItemList({ tab, className }: ShopItemListProps) {
  const { data: items, isLoading, isError } = useShopItems(tab)
  const purchaseMutation = usePurchaseItem()

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading shop items">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className={cn('text-center py-8 text-danger text-14', className)} role="alert">
        Failed to load shop items.
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-48 mb-2" aria-hidden="true">🏪</p>
        <p className="text-14 text-text-secondary">No items available right now.</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className={cn('space-y-3', className)}
    >
      {items.map((item) => (
        <ShopItemCard
          key={item.id}
          item={item}
          onPurchase={(itemId) => purchaseMutation.mutate({ itemId })}
          isPurchasing={purchaseMutation.isPending}
        />
      ))}
    </motion.div>
  )
}
