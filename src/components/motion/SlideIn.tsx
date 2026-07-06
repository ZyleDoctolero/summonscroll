import { motion, type HTMLMotionProps } from 'framer-motion'
import { slideInRight, slideInLeft } from '@/lib/animations'

export interface SlideInProps extends HTMLMotionProps<'div'> {
  direction?: 'left' | 'right'
}

export function SlideIn({ direction = 'right', children, ...props }: SlideInProps) {
  const variants = direction === 'left' ? slideInLeft : slideInRight

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  )
}
