import { useEffect } from 'react'
import { useUiStore } from '@/stores/uiStore'

const CURRENCY_ICONS = {
  crystals: '💎',
  shards:   '🔷',
  seals:    '🔑',
  xp:       '✨',
}

const CURRENCY_COLORS = {
  crystals: 'text-rarity-rare',
  shards:   'text-void',
  seals:    'text-gold',
  xp:       'text-gold-bright',
}

export function CurrencyFloatLayer() {
  const { floatingCurrencies, removeFloatingCurrency } = useUiStore()

  return (
    <div
      className="fixed inset-0 pointer-events-none z-toast"
      aria-hidden="true"
    >
      {floatingCurrencies.map((fc) => (
        <FloatingCurrency
          key={fc.id}
          id={fc.id}
          amount={fc.amount}
          type={fc.type}
          x={fc.x}
          y={fc.y}
          onDone={removeFloatingCurrency}
        />
      ))}
    </div>
  )
}

interface FloatingCurrencyProps {
  id: string
  amount: number
  type: keyof typeof CURRENCY_ICONS
  x: number
  y: number
  onDone: (id: string) => void
}

function FloatingCurrency({ id, amount, type, x, y, onDone }: FloatingCurrencyProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(id), 900)
    return () => clearTimeout(timer)
  }, [id, onDone])

  return (
    <div
      className={`absolute animate-float-up font-mono font-bold text-14 ${CURRENCY_COLORS[type]} flex items-center gap-0.5`}
      style={{
        left: x || '50%',
        top: y || '40%',
        transform: 'translateX(-50%)',
      }}
    >
      <span>{CURRENCY_ICONS[type]}</span>
      <span>+{amount}</span>
    </div>
  )
}
