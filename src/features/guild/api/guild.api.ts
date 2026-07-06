import { api } from '@/lib/api'
import type { ApiResponse, Guild } from '@/types'
import type { GuildMember, GuildFilters } from '../types'

export const guildApi = {
  getMyGuild: () =>
    api.get<ApiResponse<Guild | null>>('/guild/mine'),

  getGuilds: (filters?: GuildFilters) => {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    const qs = params.toString()
    return api.get<ApiResponse<Guild[]>>(`/guild${qs ? `?${qs}` : ''}`)
  },

  getGuild: (id: string) =>
    api.get<ApiResponse<Guild>>(`/guild/${id}`),

  createGuild: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<Guild>>('/guild', data),

  joinGuild: (guildId: string) =>
    api.post<ApiResponse<{ success: boolean }>>(`/guild/${guildId}/join`),

  leaveGuild: () =>
    api.post<ApiResponse<{ success: boolean }>>('/guild/leave'),

  getMembers: (guildId: string) =>
    api.get<ApiResponse<GuildMember[]>>(`/guild/${guildId}/members`),
}
