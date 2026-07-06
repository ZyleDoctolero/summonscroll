import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { battlesApi } from '../api/battles.api'
import { battleKeys } from '../queryKeys'
import type { StartBattleRequest } from '../types'

export function useBattleHistory() {
  return useQuery({
    queryKey: battleKeys.history(),
    queryFn: () => battlesApi.getHistory(),
    staleTime: 1000 * 60, // 1 minute
    select: (data) => data.data,
  })
}

export function useStartBattle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StartBattleRequest) => battlesApi.startBattle(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: battleKeys.history() })
    },
  })
}
