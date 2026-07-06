import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { guildApi } from '../api/guild.api'
import { guildKeys } from '../queryKeys'
import type { GuildFilters } from '../types'

export function useMyGuild() {
  return useQuery({
    queryKey: guildKeys.mine(),
    queryFn: () => guildApi.getMyGuild(),
    staleTime: 1000 * 60, // 1 minute
    select: (data) => data.data,
  })
}

export function useGuilds(filters?: GuildFilters, enabled = true) {
  return useQuery({
    queryKey: [...guildKeys.browse(), filters],
    queryFn: () => guildApi.getGuilds(filters),
    enabled,
    select: (data) => data.data,
  })
}

export function useGuildMembers(guildId: string) {
  return useQuery({
    queryKey: guildKeys.members(guildId),
    queryFn: () => guildApi.getMembers(guildId),
    enabled: !!guildId,
    select: (data) => data.data,
  })
}

export function useCreateGuild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      guildApi.createGuild(data),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: guildKeys.all })
    },
  })
}

export function useJoinGuild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (guildId: string) => guildApi.joinGuild(guildId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: guildKeys.all })
    },
  })
}

export function useLeaveGuild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => guildApi.leaveGuild(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: guildKeys.all })
    },
  })
}
