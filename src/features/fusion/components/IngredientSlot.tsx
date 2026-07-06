import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LazyImage } from '@/components/ui/LazyImage'
import type { UserMonster } from '@/types'
import { fusionCardVariants } from '../animations/fusion.variants'

export interface IngredientSlotProps {
  userMonster?: UserMonster
  slotIndex: number
  onRemove?: (id: string) => void
  className?: string
}

export function IngredientSlot({ userMonster, slotIndex, onRemove, className }: IngredientSlotProps) {
  return (
    <motion.div
      variants={fusionCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      aria-label={userMonster ? `Ingredient slot ${slotIndex + 1}: ${userMonster.monster.name}` : `Empty ingredient slot ${slotIndex + 1}`}
      className={cn(
        'w-24 h-32 rounded-lg border-2 flex flex-col items-center justify-center',
        userMonster
          ? 'border-gold/40 bg-bg-elevated'
          : 'border-dashed border-border bg-bg-deep',
        className,
      )}
    >
      {userMonster ? (
        <>
          <div className="w-16 h-16 rounded-md overflow-hidden bg-bg-surface">
            {userMonster.monster.artUrl ? (
              <LazyImage src={userMonster.monster.artUrl} alt={userMonster.monster.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-24 opacity-40" aria-hidden="true">
                👾
              </div>
            )}
          </div>
          <p className="text-10 font-cinzel text-text-primary mt-1 truncate max-w-full px-1 text-center">
            {userMonster.monster.name}
          </p>
          {onRemove && (
            <button
              onClick={() => onRemove(userMonster.id)}
              aria-label={`Remove ${userMonster.monster.name}`}
              className="text-10 text-danger hover:underline focus:outline-none focus:ring-1 focus:ring-danger/60 rounded"
            >
              Remove
            </button>
          )}
        </>
      ) : (
        <span className="text-text-disabled text-20" aria-hidden="true">+</span>
      )}
    </motion.div>
  )
}
