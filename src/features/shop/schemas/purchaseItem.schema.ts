import { z } from 'zod'

export const purchaseItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Maximum quantity is 99')
    .default(1),
})

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
