import { type Variants, useReducedMotion } from 'framer-motion'

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// Scale animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

export const scaleInLarge: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
}

// Slide animations
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.2 } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
}

// Stagger animations
export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export const staggerChildrenFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

// Micro-interactions
export const buttonPress = {
  scale: 0.97,
  transition: { duration: 0.1 },
} as const

export const cardHover = {
  y: -2,
  transition: { duration: 0.2 },
} as const

// Utility hook — strips transforms for users who prefer reduced motion
export function useSafeVariants(variants: Variants): Variants {
  const shouldReduce = useReducedMotion()
  if (!shouldReduce) return variants

  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      const v = value as Record<string, unknown>
      return [key, { opacity: (v['opacity'] as number | undefined) ?? 1, transition: { duration: 0 } }]
    }),
  ) as Variants
}
