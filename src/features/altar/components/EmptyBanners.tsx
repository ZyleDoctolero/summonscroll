import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'

export function EmptyBanners() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="text-center py-16"
    >
      <div className="text-64 mb-4" aria-hidden="true">⛩</div>
      <h3 className="font-cinzel text-18 text-text-primary mb-2">
        No banners available
      </h3>
      <p className="text-14 text-text-secondary max-w-md mx-auto">
        Check back later for new summon opportunities. The altar awaits your return.
      </p>
    </motion.div>
  )
}
