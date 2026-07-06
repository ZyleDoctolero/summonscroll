import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { cardHover, buttonPress } from '@/lib/animations'
import { BannerArt } from './BannerArt'
import { BannerInfo } from './BannerInfo'
import { PullButtons } from './PullButtons'
import type { Banner } from '@/types'

export interface BannerCardProps {
  banner: Banner
  className?: string
  isHabitCharged?: boolean
  isPending?: boolean
  canAfford?: boolean
  onPull?: (count: 1 | 10) => void
}

function getTimeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}m`
}

export function BannerCard({ banner, className, isHabitCharged, isPending, canAfford, onPull }: BannerCardProps) {
  const timeLeft = getTimeRemaining(banner.endsAt)
  const isExpired = timeLeft === 'Ended'

  return (
    <motion.article
      className={cn(
        'relative bg-bg-surface rounded-lg overflow-hidden border transition-all group',
        isExpired && 'opacity-50',
        isHabitCharged && 'shadow-[0_0_28px_rgba(255,183,77,0.16)]',
        className,
      )}
      style={{ borderColor: isHabitCharged ? 'rgba(255,183,77,0.45)' : 'var(--color-border)' }}
      aria-label={`${banner.name} banner`}
      whileHover={cardHover}
    >
      <BannerArt
        artUrl={banner.artUrl ?? undefined}
        bannerName={banner.name}
        bannerType={banner.bannerType}
        timeLeft={timeLeft}
      />

      <div className="p-3">
        <BannerInfo
          name={banner.name}
          realmName={banner.realm?.name}
          featuredMonsterName={banner.featuredMonster?.name}
          isHabitCharged={isHabitCharged}
        />
        <PullButtons
          bannerName={banner.name}
          pullCost={banner.pullCost}
          pullCurrency={banner.pullCurrency}
          isExpired={isExpired}
          isPending={isPending}
          canAfford={canAfford}
          onPull={onPull}
        />
      </div>
    </motion.article>
  )
}

export function BannerCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative bg-bg-surface rounded-lg overflow-hidden border border-border',
        className,
      )}
    >
      {/* Banner art skeleton */}
      <Skeleton className="w-full h-48" />

      {/* Info skeleton */}
      <div className="p-3">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2 mb-3" />

        {/* Button skeletons */}
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-9" />
          <Skeleton className="flex-[2] h-9" />
        </div>
      </div>
    </div>
  )
}

export interface BannerCardErrorProps {
  error: Error
  onRetry?: () => void
  className?: string
}

export function BannerCardError({ error, onRetry, className }: BannerCardErrorProps) {
  return (
    <div
      className={cn(
        'relative bg-bg-surface rounded-lg overflow-hidden border border-border p-6 text-center',
        className,
      )}
    >
      <div className="text-48 mb-3" aria-hidden="true">⚠️</div>
      <h3 className="font-cinzel font-semibold text-16 text-text-primary mb-2">
        Failed to load banner
      </h3>
      <p className="text-13 text-text-secondary mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="px-4 py-2 bg-gold text-bg-deep rounded-md text-13 font-medium hover:bg-gold-bright transition-colors"
          whileTap={buttonPress}
        >
          Try Again
        </motion.button>
      )}
    </div>
  )
}
