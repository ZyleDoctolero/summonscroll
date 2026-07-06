import { type Variants } from 'framer-motion'

export const guildCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export const memberJoinVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, x: -20 },
  visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const guildListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
