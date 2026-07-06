import { motion, type HTMLMotionProps } from 'framer-motion'
import { staggerChildren } from '@/lib/animations'

export interface StaggerListProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  fast?: boolean
}

export function StaggerList({ children, fast = false, ...props }: StaggerListProps) {
  const variants = fast ? {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  } : staggerChildren

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
}
