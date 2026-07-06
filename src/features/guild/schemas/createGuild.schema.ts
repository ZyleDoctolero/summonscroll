import { z } from 'zod'

export const createGuildSchema = z.object({
  name: z.string()
    .min(3, 'Guild name must be at least 3 characters')
    .max(50, 'Guild name must be at most 50 characters'),
  description: z.string().max(200, 'Description must be at most 200 characters').optional(),
})

export type CreateGuildInput = z.infer<typeof createGuildSchema>
