import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'surface' | 'elevated' | 'bordered' | 'default'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-bg-surface border border-border',
  surface: 'bg-bg-surface border border-border',
  elevated: 'bg-bg-elevated border border-border shadow-xl',
  bordered: 'bg-transparent border border-border-active',
}

/**
 * Basic content surface. Padded container matching the app's dark theme
 * (see index.css tokens). Spread props pass through, so callers can add
 * onClick, role, etc.
 */
export function Card({ variant = 'surface', className, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-lg p-4', variantClasses[variant], className)} {...props}>
      {children}
    </div>
  )
}
