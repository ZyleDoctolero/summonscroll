import { MonsterCard } from './MonsterCard'
import { MonsterListError } from './MonsterListError'
import { EmptyMonsters } from './EmptyMonsters'
import { StaggerList } from '@/components/motion/StaggerList'
import { cn } from '@/lib/utils'
import type { FilterState } from './FilterBar'
import type { UserMonster } from '@/types'

interface MonsterListProps {
  filters: FilterState
  activeRealmTab: string
  isLoading: boolean
  isError: boolean
  error: Error | null
  monsters: UserMonster[]
  onRetry: () => void
  onSelectMonster: (id: string) => void
}

/** Check if any filter is actively narrowing results */
function hasActiveFilters(filters: FilterState, activeRealmTab: string): boolean {
  return (
    filters.rarity !== '' ||
    filters.element !== '' ||
    filters.role !== '' ||
    filters.search !== '' ||
    activeRealmTab !== 'all'
  )
}

export default function MonsterList({
  filters,
  activeRealmTab,
  isLoading,
  isError,
  error,
  monsters,
  onRetry,
  onSelectMonster,
}: MonsterListProps) {
  // Error state
  if (isError && error) {
    return <MonsterListError error={error} onRetry={onRetry} />
  }

  // Empty state — distinguish "no monsters owned" from "no filter results"
  if (!isLoading && monsters.length === 0) {
    if (hasActiveFilters(filters, activeRealmTab)) {
      return (
        <div className="text-center py-16">
          <div className="text-48 mb-3" aria-hidden="true">🔍</div>
          <h3 className="font-cinzel text-16 text-text-secondary mb-1">
            No monsters match your filters
          </h3>
          <p className="text-14 text-text-tertiary">
            Try adjusting your filters or search to find what you're looking for.
          </p>
        </div>
      )
    }
    return <EmptyMonsters />
  }

  // Monster grid/list
  if (monsters.length > 0) {
    return (
      <StaggerList
        className={cn(
          filters.view === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
            : 'space-y-2',
        )}
        role="list"
        aria-label="Your monster collection"
      >
        {monsters.map((um) => (
          <div key={um.id} role="listitem">
            <MonsterCard
              userMonster={um}
              view={filters.view}
              onClick={() => onSelectMonster(um.id)}
            />
          </div>
        ))}
      </StaggerList>
    )
  }

  return null
}
