import { cn } from '@/lib/utils'
import type { Element } from '@/types'

const ELEMENT_ICONS: Record<Element, string> = {
  fire:       '🔥',
  water:      '💧',
  earth:      '🪨',
  wind:       '🌀',
  light:      '☀️',
  dark:       '🌑',
  void:       '🌌',
  digital:    '💻',
  ice:        '❄️',
  thunder:    '⚡',
  nature:     '🌿',
  stellar:    '⭐',
  primordial: '🌋',
  synthetic:  '🤖',
  arcane:     '🔮',
  chaos:      '💀',
  dread:      '🩸',
  death:      '💀',
  divine:     '✨',
}

const ELEMENT_LABELS: Record<Element, string> = {
  fire:       'Fire',
  water:      'Water',
  earth:      'Earth',
  wind:       'Wind',
  light:      'Light',
  dark:       'Dark',
  void:       'Void',
  digital:    'Digital',
  ice:        'Ice',
  thunder:    'Thunder',
  nature:     'Nature',
  stellar:    'Stellar',
  primordial: 'Primordial',
  synthetic:  'Synthetic',
  arcane:     'Arcane',
  chaos:      'Chaos',
  dread:      'Dread',
  death:      'Death',
  divine:     'Divine',
}

interface ElementIconProps {
  element: Element
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-14',
  md: 'text-16',
  lg: 'text-20',
}

export function ElementIcon({
  element,
  size = 'md',
  showLabel = false,
  className,
}: ElementIconProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1', SIZE_CLASSES[size], className)}
      title={ELEMENT_LABELS[element]}
      aria-label={`${ELEMENT_LABELS[element]} element`}
    >
      <span aria-hidden="true">{ELEMENT_ICONS[element]}</span>
      {showLabel && (
        <span
          className="text-12 font-medium"
          style={{ color: `var(--element-${element})` }}
        >
          {ELEMENT_LABELS[element]}
        </span>
      )}
    </span>
  )
}
