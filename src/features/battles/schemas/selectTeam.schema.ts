import { z } from 'zod'

export const selectTeamSchema = z.object({
  monsterIds: z.array(z.string().uuid()).min(1, 'Select at least 1 monster').max(5, 'Maximum 5 monsters'),
})

export type SelectTeamInput = z.infer<typeof selectTeamSchema>
