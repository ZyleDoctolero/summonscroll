import type { Variants } from 'framer-motion'

export const monsterCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  hover: {
    y: -4,
    transition: { duration: 0.2 }
  },
}
