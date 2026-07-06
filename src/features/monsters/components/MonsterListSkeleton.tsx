import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface MonsterListSkeletonProps {
  view?: 'grid' | 'list'
  count?: number
}

export function MonsterListSkeleton({ view = 'grid', count = 10 }: MonsterListSkeletonProps) {
  return (
    <div
      className={cn(
        view === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
          : 'space-y-2',
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'rounded-lg',
            view === 'grid' ? 'aspect-[3/4]' : 'h-16',
          )}
        />
      ))}
    </div>
  )
}
