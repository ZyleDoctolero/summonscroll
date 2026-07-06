import type { Variants } from 'framer-motion'
import { fadeInUp, scaleIn } from '@/lib/animations'

/** Feature-level defaults; compose with `useSafeVariants` where motion is used. */
export const habitCardEnter: Variants = fadeInUp
export const habitFormReveal: Variants = scaleIn
