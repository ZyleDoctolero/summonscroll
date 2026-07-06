export type { Guild } from '@/types'

export interface GuildMember {
  id: string
  userId: string
  username: string
  avatarUrl: string | null
  level: number
  contribution: number
  joinedAt: string
}

export interface GuildFilters {
  search?: string
  page?: number
  pageSize?: number
}
