import { api } from '@/lib/api'
import type { ApiResponse, PaginatedResponse, ShopItem } from '@/types'

export const shopApi = {
  getItems: (tab?: 'daily' | 'featured' | 'packs') => {
    const qs = tab ? `?tab=${tab}` : ''
    return api.get<PaginatedResponse<ShopItem>>(`/shop${qs}`)
  },
  purchase: (itemId: string, quantity: number = 1) =>
    api.post<ApiResponse<{ success: boolean; newBalances: Record<string, number> }>>(
      `/shop/${itemId}/purchase`,
      { quantity },
    ),
}
