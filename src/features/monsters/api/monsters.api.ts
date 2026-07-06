import { api } from '@/lib/api'
import type { ApiResponse, Monster, PaginatedResponse, Realm, UserMonster } from '@/types'

export interface MonsterFilters {
  realmId?: string
  rarity?: string
  element?: string
  role?: string
  search?: string
  sort?: 'rarity' | 'level' | 'bond' | 'recent' | 'name'
  page?: number
  pageSize?: number
}

export const monstersApi = {
  getMonsters: (filters?: MonsterFilters) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v))
      })
    }
    const qs = params.toString()
    return api.get<PaginatedResponse<Monster>>(`/monsters${qs ? `?${qs}` : ''}`)
  },

  getMonster: (id: string) => api.get<ApiResponse<Monster>>(`/monsters/${id}`),

  getUserMonsters: (filters?: MonsterFilters) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v))
      })
    }
    const qs = params.toString()
    return api.get<PaginatedResponse<UserMonster>>(`/user/monsters${qs ? `?${qs}` : ''}`)
  },

  getUserMonster: (id: string) =>
    api.get<ApiResponse<UserMonster>>(`/user/monsters/${id}`),

  awaken: (userMonsterId: string, sacrificeId: string) =>
    api.post<ApiResponse<UserMonster>>(`/user/monsters/${userMonsterId}/awaken`, {
      sacrificeId,
    }),

  setTeamSlot: (userMonsterId: string, slot: number | null) =>
    api.patch<ApiResponse<UserMonster>>(`/user/monsters/${userMonsterId}/team`, {
      slot,
    }),

  equipSkin: (userMonsterId: string, skinId: string | null) =>
    api.patch<ApiResponse<UserMonster>>(`/user/monsters/${userMonsterId}/skin`, {
      skinId,
    }),

  getRealms: () => api.get<ApiResponse<Realm[]>>('/realms'),

  getCollectionStats: () =>
    api.get<ApiResponse<Array<{ realmId: string; total: number; owned: number }>>>(
      '/user/collection-stats',
    ),
}
