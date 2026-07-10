import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
  /** Accessible label announced to assistive tech while loading. */
  label?: string
}

/**
 * Loading placeholder. Uses the global `.skeleton` shimmer (see index.css),
 * which already respects prefers-reduced-motion. Size/shape via className.
 */
export function Skeleton({ className, label = 'Loading' }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    />
  )
}
