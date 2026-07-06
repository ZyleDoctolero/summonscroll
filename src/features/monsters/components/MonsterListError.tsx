import { motion } from 'framer-motion'
import { fadeInUp, buttonPress } from '@/lib/animations'

interface MonsterListErrorProps {
  error: Error
  onRetry?: () => void
}

export function MonsterListError({ error, onRetry }: MonsterListErrorProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="text-center py-16"
    >
      <div className="text-64 mb-4" aria-hidden="true">⚠️</div>
      <h3 className="font-cinzel text-18 text-text-primary mb-2">
        Failed to load collection
      </h3>
      <p className="text-14 text-text-secondary mb-4 max-w-md mx-auto">
        {error.message || 'An unexpected error occurred while loading your monsters.'}
      </p>
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="px-4 py-2 bg-gold text-bg-deep rounded-md text-14 font-medium hover:bg-gold-bright transition-colors"
          whileTap={buttonPress}
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  )
}
