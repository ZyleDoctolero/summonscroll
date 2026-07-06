interface BannerInfoProps {
  name: string
  realmName?: string
  featuredMonsterName?: string
  isHabitCharged?: boolean
}

export function BannerInfo({
  name,
  realmName,
  featuredMonsterName,
  isHabitCharged,
}: BannerInfoProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate font-cinzel text-16 font-semibold text-text-primary">
        {name}
        </h3>
        {isHabitCharged && (
          <span className="shrink-0 rounded-pill border border-gold/50 bg-gold/10 px-2 py-0.5 text-10 font-semibold uppercase tracking-wider text-gold-bright">
            Habit Charged
          </span>
        )}
      </div>
      <p className="text-12 text-text-secondary">
        {[realmName, featuredMonsterName ? `Featured: ${featuredMonsterName}` : null]
          .filter(Boolean)
          .join(' | ')}
      </p>
    </div>
  )
}
