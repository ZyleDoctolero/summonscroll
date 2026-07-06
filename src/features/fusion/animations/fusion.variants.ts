import { type Variants } from 'framer-motion'

export const fusionCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.2 } },
}

export const fusionMergeVariants: Variants = {
  idle: { scale: 1, rotate: 0 },
  merging: {
    scale: [1, 1.15, 0.9, 1.2, 1],
    rotate: [0, 5, -5, 3, 0],
    transition: { duration: 1.2, times: [0, 0.25, 0.5, 0.75, 1], ease: 'easeInOut' },
  },
}

export const fusionResultVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } },
}

export const fusionListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
