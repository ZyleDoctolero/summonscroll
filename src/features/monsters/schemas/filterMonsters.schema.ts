import { z } from 'zod'

export const filterMonstersSchema = z.object({
  realmId: z.string().optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'elite', 'epic', 'legendary', 'mythic', 'ex']).optional(),
  element: z.string().optional(),
  role: z.enum(['attacker', 'tank', 'healer', 'debuffer', 'support']).optional(),
  search: z.string().optional(),
  sort: z.enum(['rarity', 'level', 'bond', 'recent', 'name']).optional(),
})

export type FilterMonstersInput = z.infer<typeof filterMonstersSchema>
