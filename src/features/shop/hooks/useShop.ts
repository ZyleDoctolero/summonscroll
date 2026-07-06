import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopApi } from '../api/shop.api'
import { shopKeys } from '../queryKeys'
import type { ShopCategoryTab } from '../store/shopUi.store'

export function useShopItems(tab?: ShopCategoryTab) {
  return useQuery({
    queryKey: shopKeys.items(tab),
    queryFn: () => shopApi.getItems(tab),
    staleTime: 1000 * 60, // 1 minute
    placeholderData: (prev) => prev,
    select: (data) => data.data,
  })
}

export function usePurchaseItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity?: number }) =>
      shopApi.purchase(itemId, quantity),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: shopKeys.all })
    },
  })
}
