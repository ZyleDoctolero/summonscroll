import { api } from '@/lib/api'
import type { ApiResponse, Monster } from '@/types'

export interface FusionPreviewResult {
  resultMonster: Monster | null
  isCrossRealm: boolean
  successRate: number
  isNamedRecipe: boolean
  elementResult: string | null
  rarityResult: string | null
}

export const fusionApi = {
  preview: (ingredientIds: string[]) =>
    api.post<ApiResponse<FusionPreviewResult>>('/fusion/preview', { ingredientIds }),

  perform: (ingredientIds: string[]) =>
    api.post<ApiResponse<{ resultMonster: Monster; consumed: string[] }>>('/fusion/perform', {
      ingredientIds,
    }),
}
