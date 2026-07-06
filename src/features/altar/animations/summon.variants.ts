import type { Variants } from 'framer-motion'

/**
 * Summon reveal animation for monster cards
 * Used in SummonReveal component for dramatic monster appearance
 */
export const summonRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    rotate: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.34, 1.56, 0.64, 1],
      scale: { delay: 0.1 }
    }
  },
  exit: { opacity: 0, scale: 1.2, transition: { duration: 0.3 } },
}

/**
 * Rarity glow animation for high-rarity monsters
 * Creates a pulsing glow effect for legendary/mythic/ex monsters
 */
export const rarityGlowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: [0, 1, 0.8, 1],
    transition: { duration: 1.2, times: [0, 0.3, 0.6, 1] }
  },
}
