import { api } from '@/lib/api'
import type { Achievement, ApiResponse } from '@/types'

export const profileApi = {
  getAchievements: () => api.get<ApiResponse<Achievement[]>>('/achievements'),
}
