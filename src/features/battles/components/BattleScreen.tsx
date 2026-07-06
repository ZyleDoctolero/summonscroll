import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { battlesApi } from '@/features/battles/api/battles.api'
import { battleKeys } from '@/features/battles/queryKeys'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import type { BattleMode, UserMonster } from '@/types'
import type { BattleState, BattleRewards } from '../api/battles.api'
import { BattlePrep } from './BattlePrep'
import { BattleOutcome } from './BattleOutcome'

interface BattleScreenProps {
  team: UserMonster[]
  mode: BattleMode
  floor?: number
  onClose: () => void
}

export function BattleScreen({ team, mode, floor = 1, onClose }: BattleScreenProps) {
  const queryClient = useQueryClient()
  const { updateCurrencies, updateXp } = useUserStore()
  const { addToast } = useUiStore()

  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [rewards, setRewards] = useState<BattleRewards | null>(null)
  const [enemyName, setEnemyName] = useState<string>('Enemy')
  const [logIndex, setLogIndex] = useState(0)

  const battleMutation = useMutation({
    mutationFn: () =>
      battlesApi.startBattle({
        teamMonsterIds: team.map((um) => um.id),
        mode,
        floor,
      }),
    onSuccess: (res) => {
      const { battleState: state, rewards: r, enemy } = res.data
      setBattleState(state)
      setRewards(r)
      setEnemyName(enemy.name)
      setLogIndex(0)

      updateCurrencies({
        spiritCrystals: r.spiritCrystals,
        voidShards: r.voidShards,
        pactSeals: r.pactSeals,
      })
      updateXp(r.xp)

      void queryClient.invalidateQueries({ queryKey: battleKeys.history() })
      void queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (err) => {
      addToast({
        type: 'error',
        title: 'Battle failed',
        message: err instanceof Error ? err.message : 'Please try again.',
      })
    },
  })

  if (!battleState) {
    return (
      <BattlePrep
        team={team}
        mode={mode}
        floor={floor}
        isPending={battleMutation.isPending}
        onStart={() => battleMutation.mutate()}
        onClose={onClose}
      />
    )
  }

  return (
    <BattleOutcome
      battleState={battleState}
      rewards={rewards}
      enemyName={enemyName}
      mode={mode}
      floor={floor}
      logIndex={logIndex}
      onNextLogChunk={() =>
        setLogIndex((i) => Math.min(i + 5, battleState.log.length - 1))
      }
      onClose={onClose}
    />
  )
}
