import { Link } from '@tanstack/react-router'
import { Scroll, Flame, BookOpen, Swords } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { CurrencyBar } from '@/components/ui/CurrencyBar'
import { Icon } from '@/components/ui/Icon'
import type { LucideIcon } from 'lucide-react'

interface QuickLink {
  label: string
  desc: string
  icon: LucideIcon
  to: string
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Directives', desc: 'Complete habits', icon: Scroll,   to: '/directives' },
  { label: 'Altar',      desc: 'Summon monsters', icon: Flame,    to: '/altar' },
  { label: 'Compendium', desc: 'View collection', icon: BookOpen, to: '/compendium' },
  { label: 'Battle',     desc: 'Fight dungeons',  icon: Swords,   to: '/battles' },
]

export function HubPage() {
  const user = useUserStore((s) => s.user)

  const xpPercent = user
    ? Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100))
    : 0

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Welcome */}
      <section>
        <h1 className="font-cinzel font-bold text-24 text-text-primary">
          {user ? `Welcome back, ${user.username}` : 'Welcome'}
        </h1>
        <p className="text-text-secondary text-14 mt-1">
          Complete your habits to earn summon currencies.
        </p>
      </section>

      {/* XP Bar */}
      {user && (
        <section
          className="bg-bg-surface rounded-lg p-4 border border-border"
          aria-label="Experience progress"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-cinzel font-semibold text-16 text-gold">
              Level {user.level}
            </span>
            <span className="font-cinzel font-semibold text-16 text-text-tertiary">
              Level {user.level + 1}
            </span>
          </div>
          <div
            className="h-3 bg-bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={xpPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${user.xp.toLocaleString()} / ${user.xpToNextLevel.toLocaleString()} XP`}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${xpPercent}%`,
                background:
                  'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))',
              }}
            />
          </div>
          <p className="text-text-tertiary text-12 font-mono mt-1.5 text-right">
            {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()} XP
            &nbsp;·&nbsp; {xpPercent}%
          </p>
        </section>
      )}

      {/* Currencies */}
      <section
        className="bg-bg-surface rounded-lg p-4 border border-border"
      >
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Currencies
        </h2>
        <CurrencyBar className="flex-wrap" />
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-3">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="bg-bg-surface border border-border rounded-lg p-4 flex flex-col gap-1 hover:bg-bg-hover transition-colors group"
          >
            <span className="w-8 h-8 rounded-md bg-bg-elevated flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Icon icon={item.icon} size={20} className="text-gold" />
            </span>
            <span className="font-cinzel font-semibold text-14 text-text-primary">
              {item.label}
            </span>
            <span className="text-12 text-text-secondary">{item.desc}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
