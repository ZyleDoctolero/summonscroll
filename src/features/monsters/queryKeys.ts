import type { MonsterFilters } from './api/monsters.api'

export const monsterKeys = {
  all: ['monsters'] as const,
  lists: () => [...monsterKeys.all, 'list'] as const,
  list: (filters?: MonsterFilters) => [...monsterKeys.lists(), filters] as const,
  detail: (id: string) => [...monsterKeys.all, id] as const,
  userCollection: (filters?: MonsterFilters) => [...monsterKeys.all, 'collection', filters] as const,
}
