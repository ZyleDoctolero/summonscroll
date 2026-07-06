import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bannersApi } from '../api/banners.api'
import { bannerKeys } from '../queryKeys'
import { useUserStore } from '@/stores/userStore'

export function usePullBanner() {
  const queryClient = useQueryClient()
  const updateCurrency = useUserStore((state) => state.updateCurrencies)

  return useMutation({
    mutationFn: ({ bannerId, count }: { bannerId: string; count: 1 | 10 }) =>
      bannersApi.pull(bannerId, count),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() })

      // Update user currency
      const spent = response.data.currencySpent
      updateCurrency({
        spiritCrystals: spent.spiritCrystals > 0 ? -spent.spiritCrystals : undefined,
        voidShards: spent.voidShards > 0 ? -spent.voidShards : undefined,
        pactSeals: spent.pactSeals > 0 ? -spent.pactSeals : undefined,
      })
    },
  })
}
