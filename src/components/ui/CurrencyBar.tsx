import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'

interface CurrencyBarProps {
  className?: string
}

export function CurrencyBar({ className }: CurrencyBarProps) {
  const user = useUserStore((s) => s.user)

  if (!user) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-6 w-20 rounded-pill" />
        ))}
      </div>
    )
  }

  const currencies = [
    {
      label: 'Spirit Crystals',
      value: user.spiritCrystals,
      icon: <img src="/images/summonscroll/spirit_crystal.jpg" alt="Spirit Crystals" className="w-4 h-4 object-contain" />,
      color: 'text-rarity-rare',
    },
    {
      label: 'Void Shards',
      value: user.voidShards,
      icon: <img src="/images/summonscroll/void_shard.jpg" alt="Void Shards" className="w-4 h-4 object-contain" />,
      color: 'text-void',
    },
    {
      label: 'Pact Seals',
      value: user.pactSeals,
      icon: <img src="/images/summonscroll/pact_seal.jpg" alt="Pact Seals" className="w-4 h-4 object-contain" />,
      color: 'text-gold',
    },
  ]

  return (
    <div
      className={cn('flex items-center gap-2 sm:gap-3', className)}
      aria-label="Currency balances"
    >
      {currencies.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-1 bg-bg-elevated rounded-pill px-2.5 py-1"
          title={c.label}
        >
          <span aria-hidden="true" className="text-14 leading-none">
            {c.icon}
          </span>
          <span
            className={cn('font-mono font-bold text-12 tabular-nums', c.color)}
            aria-label={`${c.value.toLocaleString()} ${c.label}`}
          >
            {c.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
