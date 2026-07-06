import { motion, type HTMLMotionProps } from 'framer-motion'
import { scaleIn } from '@/lib/animations'

export function ScaleIn({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  )
}
