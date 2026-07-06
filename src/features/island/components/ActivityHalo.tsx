interface ActivityHaloProps {
  /** Whether the monster's linked habit was completed today */
  isActive: boolean
  className?: string
}

/**
 * A small status dot rendered beneath each Island monster sprite.
 * Green = habit completed today, grey = not yet completed.
 */
export function ActivityHalo({ isActive, className }: ActivityHaloProps) {
  return (
    <div
      className={className}
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: isActive
          ? 'var(--color-success)'
          : 'var(--color-text-disabled)',
        boxShadow: isActive
          ? '0 0 6px var(--color-success)'
          : 'none',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
      }}
      aria-hidden="true"
      title={isActive ? 'Habit completed today' : 'Habit not yet completed'}
    />
  )
}
