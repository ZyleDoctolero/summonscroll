import { useQuery } from '@tanstack/react-query'
import { monstersApi, type MonsterFilters } from '../api/monsters.api'
import { monsterKeys } from '../queryKeys'

export function useMonsters(filters?: MonsterFilters) {
  return useQuery({
    queryKey: monsterKeys.list(filters),
    queryFn: () => monstersApi.getMonsters(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (prev) => prev,
    select: (data) => data.data,
  })
}

export function useMonster(id: string) {
  return useQuery({
    queryKey: monsterKeys.detail(id),
    queryFn: () => monstersApi.getMonster(id),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  })
}

export function useUserMonsters(filters?: MonsterFilters) {
  return useQuery({
    queryKey: monsterKeys.userCollection(filters),
    queryFn: () => monstersApi.getUserMonsters(filters),
    staleTime: 1000 * 60, // 1 minute
    placeholderData: (prev) => prev,
    select: (data) => data.data,
  })
}

export function useUserMonster(id: string) {
  return useQuery({
    queryKey: [...monsterKeys.userCollection(), id] as const,
    queryFn: () => monstersApi.getUserMonster(id),
    staleTime: 1000 * 60,
    select: (data) => data.data,
  })
}

export function useRealms() {
  return useQuery({
    queryKey: [...monsterKeys.all, 'realms'] as const,
    queryFn: () => monstersApi.getRealms(),
    staleTime: 1000 * 60 * 60, // 1 hour - realms rarely change
    select: (data) => data.data,
  })
}

export function useCollectionStats() {
  return useQuery({
    queryKey: [...monsterKeys.all, 'collection-stats'] as const,
    queryFn: () => monstersApi.getCollectionStats(),
    staleTime: 1000 * 60, // 1 minute
    select: (data) => data.data,
  })
}
