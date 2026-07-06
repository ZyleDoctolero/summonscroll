import { cn } from '@/lib/utils'

export interface PillTab<T extends string = string> {
  id: T
  label: string
  icon?: string
  badge?: string
}

export interface PillTabsProps<T extends string = string> {
  tabs: readonly PillTab<T>[]
  activeTab: T
  onChange: (tab: T) => void
  ariaLabel: string
  className?: string
}

export function PillTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  className,
}: PillTabsProps<T>) {
  return (
    <div
      className={cn('flex gap-1 overflow-x-auto pb-1 scrollbar-none', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-pill text-12 font-medium transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-gold text-bg-deep'
              : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
          )}
        >
          {tab.icon && <span aria-hidden="true" className="mr-1">{tab.icon}</span>}
          {tab.label}
          {tab.badge && (
            <span className="ml-1.5 font-mono text-10 opacity-70">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
