import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import type { ApiResponse } from '@/types'

interface LoginRewardStatus {
  claimedDays: number[]
  nextDay: number
  canClaimToday: boolean
}

interface ClaimResponse {
  day: number
  reward: { spiritCrystals: number; voidShards: number; pactSeals: number }
  nextDay: number | null
}

const DAY_REWARDS = [
  { day: 1, icon: <img src="/images/summonscroll/spirit_crystal.jpg" alt="Crystal" className="w-4 h-4 mx-auto object-contain" />, label: '20 Crystals' },
  { day: 2, icon: <img src="/images/summonscroll/spirit_crystal.jpg" alt="Crystal" className="w-4 h-4 mx-auto object-contain" />, label: '20 Crystals' },
  { day: 3, icon: <img src="/images/summonscroll/void_shard.jpg" alt="Void Shard" className="w-4 h-4 mx-auto object-contain" />, label: '1 Void Shard' },
  { day: 4, icon: <img src="/images/summonscroll/spirit_crystal.jpg" alt="Crystal" className="w-4 h-4 mx-auto object-contain" />, label: '30 Crystals' },
  { day: 5, icon: <img src="/images/summonscroll/spirit_crystal.jpg" alt="Crystal" className="w-4 h-4 mx-auto object-contain" />, label: '30 Crystals' },
  { day: 6, icon: <img src="/images/summonscroll/spirit_crystal.jpg" alt="Crystal" className="w-4 h-4 mx-auto object-contain" />, label: '50 Crystals' },
  { day: 7, icon: <img src="/images/summonscroll/pact_seal.jpg" alt="Pact Seal" className="w-4 h-4 mx-auto object-contain" />, label: 'Pact Seal!', special: true },
]

interface LoginRewardProps {
  onClose: () => void
}

export function LoginRewardModal({ onClose }: LoginRewardProps) {
  const queryClient = useQueryClient()
  const { updateCurrencies } = useUserStore()
  const { addToast } = useUiStore()

  const { data, isLoading } = useQuery({
    queryKey: ['login-reward-status'],
    queryFn: () => api.get<ApiResponse<LoginRewardStatus>>('/auth/login-reward/status'),
  })

  const status = data?.data

  const claimMutation = useMutation({
    mutationFn: () => api.post<ApiResponse<ClaimResponse>>('/auth/login-reward'),
    onSuccess: (res) => {
      const { reward } = res.data
      updateCurrencies({
        spiritCrystals: reward.spiritCrystals,
        voidShards: reward.voidShards,
        pactSeals: reward.pactSeals,
      })
      void queryClient.invalidateQueries({ queryKey: ['login-reward-status'] })
      void queryClient.invalidateQueries({ queryKey: ['user'] })
      addToast({
        type: 'achievement',
        title: `🎁 Day ${res.data.day} Reward Claimed!`,
        message: reward.pactSeals > 0
          ? '🔑 Pact Seal earned!'
          : reward.voidShards > 0
          ? `+${reward.voidShards} Void Shard${reward.voidShards > 1 ? 's' : ''}`
          : `+${reward.spiritCrystals} Spirit Crystals`,
      })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Failed to claim reward' })
    },
  })

  return (
    <div
      className="fixed inset-0 z-modal bg-bg-overlay flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Daily Login Reward"
    >
      <div
        className="bg-bg-surface border border-border rounded-xl p-6 w-full max-w-sm space-y-5"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="font-cinzel font-bold text-20 text-text-primary">
            Daily Login Reward
          </h2>
          <p className="text-13 text-text-secondary mt-1">
            Log in every day to earn bigger rewards
          </p>
        </div>

        {/* Day grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="7-day reward cycle">
            {DAY_REWARDS.map(({ day, icon, label, special }) => {
              const claimed = status?.claimedDays.includes(day) ?? false
              const isToday = status?.nextDay === day && status?.canClaimToday
              const isFuture = !claimed && !isToday

              return (
                <div
                  key={day}
                  role="listitem"
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg p-1.5 border text-center transition-all',
                    claimed && 'bg-success/10 border-success/40 opacity-60',
                    isToday && 'bg-gold/10 border-gold animate-pulse',
                    isFuture && 'bg-bg-elevated border-border opacity-50',
                    special && isToday && 'border-rarity-legendary',
                  )}
                  aria-label={`Day ${day}: ${label}${claimed ? ' (claimed)' : isToday ? ' (available)' : ' (locked)'}`}
                >
                  <span className="text-16" aria-hidden="true">{claimed ? '✓' : icon}</span>
                  <span className="text-9 font-mono text-text-tertiary mt-0.5">D{day}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Today's reward preview */}
        {status && status.canClaimToday && (
          <div
            className="bg-bg-elevated rounded-lg p-3 text-center border border-gold"
          >
            <p className="text-12 text-text-secondary mb-1">Today's Reward</p>
            <p className="font-cinzel font-semibold text-16 text-gold">
              {DAY_REWARDS[status.nextDay - 1]?.icon}{' '}
              {DAY_REWARDS[status.nextDay - 1]?.label}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {status?.canClaimToday ? (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium text-14 transition-all',
                'bg-gold text-bg-deep hover:bg-gold-bright',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-gold/60',
              )}
            >
              {claimMutation.isPending ? 'Claiming…' : '🎁 Claim Reward'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-medium text-14 bg-bg-elevated text-text-secondary hover:bg-bg-hover transition-colors"
            >
              {status?.claimedDays.length === 7 ? 'All claimed this week!' : 'Come back tomorrow'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-lg text-14 text-text-secondary bg-bg-elevated hover:bg-bg-hover transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
