import { z } from 'zod'

export const joinGuildSchema = z.object({
  guildId: z.string().min(1, 'Guild ID is required'),
})

export type JoinGuildInput = z.infer<typeof joinGuildSchema>
