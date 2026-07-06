import { motion } from 'framer-motion'

/** Pulsing "Tap to continue" indicator used in all reveal phases */
export function TapToContinue() {
  return (
    <motion.p
      className="absolute bottom-16 text-13 text-text-tertiary"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      Tap to continue
    </motion.p>
  )
}
