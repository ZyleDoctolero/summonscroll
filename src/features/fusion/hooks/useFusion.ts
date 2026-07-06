import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fusionApi } from '../api/fusion.api'
import { fusionKeys } from '../queryKeys'

export function useFusionPreview(ingredientIds: string[]) {
  return useQuery({
    queryKey: fusionKeys.preview(ingredientIds),
    queryFn: () => fusionApi.preview(ingredientIds),
    enabled: ingredientIds.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
    select: (data) => data.data,
  })
}

export function useFuseMonsters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ingredientIds: string[]) => fusionApi.perform(ingredientIds),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-monsters'] })
    },
  })
}
