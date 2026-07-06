import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { param } from '../lib/routeUtils.js'

export const shopRouter = Router()
shopRouter.use(requireAuth)

// GET /shop
shopRouter.get('/', async (req, res) => {
  const { tab } = req.query as { tab?: string }
  const where = tab ? { tab, isActive: true } : { isActive: true }
  const items = await prisma.shopItem.findMany({ where, orderBy: { createdAt: 'asc' } })
  res.json({ data: items, total: items.length, page: 1, pageSize: 50, hasMore: false })
})

// POST /shop/:id/purchase
shopRouter.post('/:id/purchase', async (req: AuthRequest, res) => {
  const item = await prisma.shopItem.findUnique({ where: { id: param(req.params['id']) } })
  if (!item || !item.isActive) { res.status(404).json({ message: 'Item not found' }); return }

  const user = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (!user) { res.status(404).json({ message: 'User not found' }); return }

  const currency = item.costCurrency as 'spiritCrystals' | 'voidShards' | 'pactSeals'
  if (user[currency] < item.cost) {
    res.status(402).json({ message: `Insufficient ${item.costCurrency}` })
    return
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: { [currency]: { decrement: item.cost } },
    select: { spiritCrystals: true, voidShards: true, pactSeals: true },
  })

  res.json({ data: { success: true, newBalances: updated } })
})
