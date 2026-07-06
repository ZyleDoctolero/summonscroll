import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'
import { Link } from '@tanstack/react-router'

export function EmptyMonsters() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="text-center py-16"
    >
      <div className="text-64 mb-4" aria-hidden="true">📖</div>
      <h3 className="font-cinzel text-18 text-text-primary mb-2">
        Your bestiary awaits your first summon
      </h3>
      <p className="text-14 text-text-secondary mb-6 max-w-md mx-auto">
        Visit the Altar to summon your first monster and begin your collection.
      </p>
      <Link
        to="/altar"
        className="inline-block px-4 py-2 bg-gold text-bg-deep rounded-lg font-medium text-14 hover:bg-gold-bright transition-colors"
      >
        Go to Altar →
      </Link>
    </motion.div>
  )
}
