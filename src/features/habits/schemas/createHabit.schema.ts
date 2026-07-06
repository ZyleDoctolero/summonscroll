import { z } from 'zod'

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  category: z.enum([
    'study',
    'fitness',
    'meditation',
    'sleep',
    'nutrition',
    'productivity',
    'custom',
  ] as const),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard'] as const),
})

export type CreateHabitInput = z.infer<typeof createHabitSchema>
