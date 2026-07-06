import { useMutation, useQueryClient } from '@tanstack/react-query'
import { habitsApi } from '../api/habits.api'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function DailyHarvest() {
  const queryClient = useQueryClient()
  const { updateCurrencies, updateXp } = useUserStore()
  const { addToast } = useUiStore()

  const mutation = useMutation({
    mutationFn: habitsApi.harvest,
    onSuccess: (res) => {
      const { totalReward, count } = res.data
      updateCurrencies({
        spiritCrystals: totalReward.spiritCrystals,
        voidShards: totalReward.voidShards,
        pactSeals: totalReward.pactSeals,
      })
      updateXp(totalReward.xp)

      addToast({
        type: 'success',
        title: `Harvested ${count} task${count !== 1 ? 's' : ''}!`,
        message: `+${totalReward.spiritCrystals} 💎  +${totalReward.xp} XP`,
      })

      void queryClient.invalidateQueries({ queryKey: ['habits'] })
      void queryClient.invalidateQueries({ queryKey: ['dailies'] })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Harvest failed. Try again.' })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={cn(
        'w-full py-3 rounded-lg font-cinzel font-semibold text-14 transition-all',
        'bg-gold/10 border border-gold/30 text-gold',
        'hover:bg-gold/20 hover:border-gold/60',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-gold/40',
      )}
      aria-label="Collect all pending habit rewards"
    >
      {mutation.isPending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin text-16" aria-hidden="true">⟳</span>
          Harvesting…
        </span>
      ) : (
        '🌾 Daily Harvest — Collect All'
      )}
    </button>
  )
}
