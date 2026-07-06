import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { CURRENCY_ICONS } from '@/lib/icons'
import { buttonPress } from '@/lib/animations'

interface PullButtonsProps {
  bannerName: string
  pullCost: number
  pullCurrency: string
  isExpired: boolean
  isPending?: boolean
  canAfford?: boolean
  onPull?: (count: 1 | 10) => void
}

export function PullButtons({
  bannerName,
  pullCost,
  pullCurrency,
  isExpired,
  isPending = false,
  canAfford = true,
  onPull,
}: PullButtonsProps) {
  const currencyIcon = CURRENCY_ICONS[pullCurrency as keyof typeof CURRENCY_ICONS]
  const isDisabled = isExpired || isPending || !canAfford

  return (
    <div className="flex flex-col gap-2 mt-3">
      <div className="flex gap-2">
        <motion.button
          onClick={() => onPull?.(1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onPull?.(1)
            }
          }}
          className={cn(
            'flex-1 py-2 rounded-md text-13 font-medium text-center flex justify-center items-center gap-1 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep',
            isDisabled
              ? 'bg-bg-elevated/50 text-text-disabled border border-border cursor-not-allowed'
              : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-border',
          )}
          aria-label={`Pull once from ${bannerName} — costs ${pullCost} ${pullCurrency}`}
          aria-disabled={isDisabled}
          whileTap={isDisabled ? undefined : buttonPress}
          disabled={isDisabled}
        >
          {isPending ? (
            <span className="inline-block w-4 h-4 border-2 border-text-disabled border-t-transparent rounded-full animate-spin" aria-label="Loading" />
          ) : (
            <>
              {currencyIcon && <Icon icon={currencyIcon} size={16} />} Pull ×1
            </>
          )}
        </motion.button>
        <motion.button
          onClick={() => onPull?.(10)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onPull?.(10)
            }
          }}
          className={cn(
            'flex-[2] py-2 rounded-md text-13 font-semibold text-center flex justify-center items-center gap-1 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep',
            isDisabled
              ? 'bg-bg-elevated/50 text-text-disabled cursor-not-allowed'
              : 'bg-gold text-bg-deep hover:bg-gold-bright',
          )}
          aria-label={`Pull 10 times from ${bannerName}`}
          aria-disabled={isDisabled}
          whileTap={isDisabled ? undefined : buttonPress}
          disabled={isDisabled}
        >
          {isPending ? (
            <span className="inline-block w-4 h-4 border-2 border-text-disabled border-t-transparent rounded-full animate-spin" aria-label="Loading" />
          ) : (
            <>
              {currencyIcon && <Icon icon={currencyIcon} size={16} />} Pull ×10
            </>
          )}
        </motion.button>
      </div>
      {!canAfford && !isExpired && (
        <p className="text-11 text-danger text-center" role="alert">
          ⚠ Insufficient {pullCurrency === 'spiritCrystals' ? 'Spirit Crystals' : pullCurrency === 'voidShards' ? 'Void Shards' : pullCurrency === 'pactSeals' ? 'Pact Seals' : pullCurrency}
        </p>
      )}
    </div>
  )
}
