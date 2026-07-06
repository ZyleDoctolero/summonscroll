import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { LazyImage } from '@/components/ui/LazyImage'
import { useFusionPreview } from '../hooks/useFusion'
import { fusionResultVariants } from '../animations/fusion.variants'

export interface FusionPreviewProps {
  ingredientIds: string[]
  className?: string
}

export function FusionPreview({ ingredientIds, className }: FusionPreviewProps) {
  const { data: preview, isPending } = useFusionPreview(ingredientIds)

  if (isPending) {
    return (
      <p className="text-13 text-text-tertiary" aria-live="polite">
        Calculating…
      </p>
    )
  }

  if (!preview?.resultMonster) {
    return (
      <p className="text-13 text-text-tertiary">
        No named recipe found. Result will be determined by elemental fusion rules.
      </p>
    )
  }

  const { resultMonster, isCrossRealm, successRate } = preview

  return (
    <motion.div
      variants={fusionResultVariants}
      initial="hidden"
      animate="visible"
      className={cn('flex items-center gap-3', className)}
    >
      <div className="w-16 h-16 rounded-md overflow-hidden bg-bg-elevated flex-shrink-0">
        {resultMonster.artUrl ? (
          <LazyImage src={resultMonster.artUrl} alt={resultMonster.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-24 opacity-40" aria-hidden="true">
            👾
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-cinzel font-semibold text-14 text-text-primary truncate">
          {resultMonster.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <RarityBadge rarity={resultMonster.rarity} size="xs" />
          {isCrossRealm && (
            <span className="text-10 text-gold bg-gold/10 rounded-pill px-1.5 py-0.5 uppercase tracking-wider">
              Cross-Realm
            </span>
          )}
        </div>
        <p className="text-12 text-text-secondary mt-0.5">
          Success rate: {successRate}%
        </p>
      </div>
    </motion.div>
  )
}
