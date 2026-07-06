import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface NavItemProps {
  to: string
  label: string
  icon: string
  isActive: boolean
  onClick?: () => void
}

export function NavItem({ to, label, icon, isActive, onClick }: NavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-14 font-medium transition-colors',
        isActive
          ? 'bg-gold/10 text-gold'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        aria-hidden="true"
        className="w-5 h-5 mix-blend-screen overflow-hidden rounded-md border border-border shadow-sm"
      >
        <img src={icon} alt="" className="w-full h-full object-cover rounded-sm" />
      </span>
      {label}
    </Link>
  )
}
