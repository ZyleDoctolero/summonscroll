import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IconProps {
  icon: LucideIcon
  size?: 12 | 16 | 20 | 24 | 32 | 40 | 48
  className?: string
  label?: string
}

export function Icon({ icon: LucideIcon, size = 16, className, label }: IconProps) {
  return (
    <LucideIcon
      size={size}
      className={cn(className)}
      aria-label={label}
      aria-hidden={!label}
      role={label ? 'img' : undefined}
    />
  )
}
