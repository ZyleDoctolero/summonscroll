import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { fadeInUp, buttonPress } from '@/lib/animations'

interface CompendiumErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

export function CompendiumErrorFallback({ error, resetError }: CompendiumErrorFallbackProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="min-h-[60vh] flex items-center justify-center px-4"
    >
      <div className="text-center max-w-md">
        <div className="text-64 mb-4" aria-hidden="true">📖</div>
        <h2 className="font-cinzel font-bold text-24 text-text-primary mb-3">
          Compendium Unavailable
        </h2>
        <p className="text-14 text-text-secondary mb-6">
          {error?.message || 'An unexpected error occurred while loading your collection. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          {resetError && (
            <motion.button
              onClick={resetError}
              className="px-4 py-2 bg-bg-elevated text-text-secondary rounded-lg font-medium text-14 hover:bg-bg-hover transition-colors"
              whileTap={buttonPress}
            >
              Try Again
            </motion.button>
          )}
          <Link to="/">
            <motion.button
              className="px-4 py-2 bg-gold text-bg-deep rounded-lg font-medium text-14 hover:bg-gold-bright transition-colors"
              whileTap={buttonPress}
            >
              Go Home
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
