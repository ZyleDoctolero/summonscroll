import { cn } from '@/lib/utils'
import type { AwakeningStage } from '@/types'

const STAGE_LABELS = ['Base', 'Awakened', 'Ascended', 'Transcendent', 'Apex', 'Apex+']

interface AwakeningStarsProps {
  stage: AwakeningStage
  maxStage?: AwakeningStage
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-12',
  md: 'text-16',
  lg: 'text-20',
}

export function AwakeningStars({
  stage,
  maxStage = 5,
  size = 'md',
  className,
}: AwakeningStarsProps) {
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      aria-label={`Awakening stage: ${STAGE_LABELS[stage]}`}
      title={STAGE_LABELS[stage]}
    >
      {Array.from({ length: maxStage }).map((_, i) => (
        <span
          key={i}
          className={cn(
            SIZE_CLASSES[size],
            'transition-colors',
            i < stage ? 'text-gold' : 'text-text-disabled',
          )}
          aria-hidden="true"
        >
          {i < stage ? '★' : '☆'}
        </span>
      ))}
      {stage > 0 && (
        <span className="ml-1 text-11 text-text-secondary font-medium">
          {STAGE_LABELS[stage]}
        </span>
      )}
    </div>
  )
}
