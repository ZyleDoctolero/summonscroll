import { motion, type HTMLMotionProps } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'

export function AnimatedPage({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  )
}
