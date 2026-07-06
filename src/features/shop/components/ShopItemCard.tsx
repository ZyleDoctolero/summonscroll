import { motion } from 'framer-motion'
import { shopItemEnter } from '../animations/shop.variants'
import { LazyImage } from '@/components/ui/LazyImage'
import { cn } from '@/lib/utils'
import type { ShopItem } from '@/types'

const CURRENCY_ICONS: Record<string, string> = {
  spiritCrystals: '💎',
  voidShards: '🔷',
  pactSeals: '🔑',
  gold: '🪙',
}

export interface ShopItemCardProps {
  item: ShopItem
  onPurchase: (itemId: string) => void
  isPurchasing?: boolean
  className?: string
}

export function ShopItemCard({ item, onPurchase, isPurchasing = false, className }: ShopItemCardProps) {
  const isLimited = item.limitedUntil !== null

  return (
    <motion.article
      variants={shopItemEnter}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex items-center gap-3 bg-bg-surface rounded-lg p-3 border border-border',
        className,
      )}
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
        {isLimited && (
          <p className="text-11 text-warning mt-0.5">⏱ Limited time</p>
        )}
      </div>

      {/* Price + buy */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="font-mono font-bold text-13 text-gold">
          {CURRENCY_ICONS[item.costCurrency] ?? '💰'} {item.cost.toLocaleString()}
        </span>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onPurchase(item.id)}
          disabled={isPurchasing}
          className="px-3 py-1 bg-gold text-bg-deep rounded-md text-12 font-medium
            hover:bg-gold-bright active:bg-gold transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface
            disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Buy ${item.name} for ${item.cost} ${item.costCurrency}`}
        >
          Buy
        </motion.button>
      </div>
    </motion.article>
  )
}
