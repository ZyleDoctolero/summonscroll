import { z } from 'zod'

export const fusionIngredientsSchema = z.object({
  ingredientIds: z
    .array(z.string())
    .min(2, 'Select at least 2 monsters to fuse')
    .max(3, 'Maximum 3 monsters can be fused at once'),
})

export type FusionIngredientsInput = z.infer<typeof fusionIngredientsSchema>
