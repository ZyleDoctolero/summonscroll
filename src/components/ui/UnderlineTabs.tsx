import { cn } from '@/lib/utils'

export interface UnderlineTab<T extends string = string> {
  id: T
  label: string
  icon?: string
}

export interface UnderlineTabsProps<T extends string = string> {
  tabs: readonly UnderlineTab<T>[]
  activeTab: T
  onChange: (tab: T) => void
  ariaLabel?: string
  className?: string
}

export function UnderlineTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  className,
}: UnderlineTabsProps<T>) {
  return (
    <div
      className={cn('flex border-b border-border', className)}
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
            'flex items-center gap-1.5 px-4 py-2.5 text-14 font-medium transition-colors border-b-2 -mb-px',
            activeTab === tab.id
              ? 'border-gold text-gold'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          )}
        >
          {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
