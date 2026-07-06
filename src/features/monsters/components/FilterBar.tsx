import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { Element, MonsterRole, Rarity } from '@/types'

export interface FilterState {
  rarity: Rarity | ''
  element: Element | ''
  role: MonsterRole | ''
  sort: 'rarity' | 'level' | 'bond' | 'recent' | 'name'
  view: 'grid' | 'list'
  search: string
}

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  className?: string
}

const RARITIES: Array<{ value: Rarity | ''; label: string }> = [
  { value: '', label: 'All Rarities' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'elite', label: 'Elite' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'mythic', label: 'Mythic' },
  { value: 'ex', label: 'EX' },
]

const ELEMENTS: Array<{ value: Element | ''; label: string }> = [
  { value: '', label: 'All Elements' },
  { value: 'fire', label: '🔥 Fire' },
  { value: 'water', label: '💧 Water' },
  { value: 'earth', label: '🪨 Earth' },
  { value: 'wind', label: '🌀 Wind' },
  { value: 'light', label: '☀️ Light' },
  { value: 'dark', label: '🌑 Dark' },
  { value: 'void', label: '🌌 Void' },
  { value: 'digital', label: '💻 Digital' },
  { value: 'ice', label: '❄️ Ice' },
  { value: 'thunder', label: '⚡ Thunder' },
  { value: 'nature', label: '🌿 Nature' },
  { value: 'stellar', label: '⭐ Stellar' },
  { value: 'primordial', label: '🌋 Primordial' },
  { value: 'synthetic', label: '🤖 Synthetic' },
]

const ROLES: Array<{ value: MonsterRole | ''; label: string }> = [
  { value: '', label: 'All Roles' },
  { value: 'attacker', label: '⚔ Attacker' },
  { value: 'tank', label: '🛡 Tank' },
  { value: 'healer', label: '💚 Healer' },
  { value: 'support', label: '⭐ Support' },
  { value: 'debuffer', label: '☠ Debuffer' },
]

const SORTS: Array<{ value: FilterState['sort']; label: string }> = [
  { value: 'rarity', label: 'Rarity ↓' },
  { value: 'level', label: 'Level ↓' },
  { value: 'bond', label: 'Bond ↓' },
  { value: 'recent', label: 'Recent' },
  { value: 'name', label: 'A–Z' },
]

const selectClass = cn(
  'bg-bg-elevated border border-border rounded-md px-2 py-1.5',
  'text-13 text-text-primary focus:outline-none focus:border-gold',
)

export function FilterBar({ filters, onChange, className }: FilterBarProps) {
  const [isPending, startTransition] = useTransition()

  const update = (partial: Partial<FilterState>) => {
    startTransition(() => {
      onChange({ ...filters, ...partial })
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Search */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search monsters…"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className={cn(
            'w-full bg-bg-elevated border border-border rounded-md pl-8 pr-3 py-2',
            'text-14 text-text-primary placeholder:text-text-disabled',
            'focus:outline-none focus:border-gold',
            isPending && 'opacity-60',
          )}
          aria-label="Search monsters"
        />
        <span
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-14"
          aria-hidden="true"
        >
          🔍
        </span>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filters.rarity}
          onChange={(e) => update({ rarity: e.target.value as Rarity | '' })}
          className={selectClass}
          aria-label="Filter by rarity"
        >
          {RARITIES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <select
          value={filters.element}
          onChange={(e) => update({ element: e.target.value as Element | '' })}
          className={selectClass}
          aria-label="Filter by element"
        >
          {ELEMENTS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>

        <select
          value={filters.role}
          onChange={(e) => update({ role: e.target.value as MonsterRole | '' })}
          className={selectClass}
          aria-label="Filter by role"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value as FilterState['sort'] })}
          className={selectClass}
          aria-label="Sort by"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Grid/List toggle */}
        <div
          className="flex rounded-md overflow-hidden border border-border ml-auto"
          role="group"
          aria-label="View mode"
        >
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => update({ view: v })}
              className={cn(
                'px-2.5 py-1.5 text-13 transition-colors',
                filters.view === v
                  ? 'bg-gold text-bg-deep'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
              )}
              aria-pressed={filters.view === v}
              aria-label={`${v} view`}
            >
              {v === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
