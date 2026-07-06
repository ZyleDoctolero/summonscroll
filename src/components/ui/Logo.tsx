import { cn } from '@/lib/utils'
import LogoDefault from '@/assets/logos/summonscroll.svg?react'
import LogoDark from '@/assets/logos/summonscroll-dark.svg?react'
import LogoLight from '@/assets/logos/summonscroll-light.svg?react'

export interface LogoProps {
  variant?: 'default' | 'dark' | 'light'
  size?: 16 | 20 | 24 | 32 | 40 | 48
  className?: string
}

const LOGO_COMPONENTS = {
  default: LogoDefault,
  dark: LogoDark,
  light: LogoLight,
} as const

export function Logo({ variant = 'default', size = 32, className }: LogoProps) {
  const LogoComponent = LOGO_COMPONENTS[variant]
  
  return (
    <LogoComponent
      className={cn(className)}
      style={{ height: `${size}px`, width: 'auto' }}
      aria-label="SummonScroll"
      role="img"
    />
  )
}
