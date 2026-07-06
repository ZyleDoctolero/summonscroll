import { api } from '@/lib/api'
import type { ApiResponse, Banner, PaginatedResponse, PullResult } from '@/types'

export interface PullCurrencySpent {
  spiritCrystals: number
  voidShards: number
  pactSeals: number
}

export interface PullBannerData {
  results: PullResult[]
  currencySpent: PullCurrencySpent
}

export const bannersApi = {
  getBanners: (type?: string) => api.get<PaginatedResponse<Banner>>(`/banners${type ? `?type=${type}` : ''}`),
  getBanner: (id: string) => api.get<ApiResponse<Banner>>(`/banners/${id}`),
  pull: (bannerId: string, count: 1 | 10) =>
    api.post<ApiResponse<PullBannerData>>(`/banners/${bannerId}/pull`, { count }),
}
