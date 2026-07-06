import { useQuery } from '@tanstack/react-query'
import { bannersApi } from '../api/banners.api'
import { bannerKeys } from '../queryKeys'

export function useBanners(type?: string) {
  return useQuery({
    queryKey: bannerKeys.list(type),
    queryFn: () => bannersApi.getBanners(type),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.data,
  })
}

export function useBanner(id: string) {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => bannersApi.getBanner(id),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  })
}
