import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { param } from '../lib/routeUtils.js'
import { cacheMiddleware } from '../lib/cache.js'

export const monstersRouter = Router()
monstersRouter.use(requireAuth)

// GET /monsters — full bestiary (cached for 5 minutes)
monstersRouter.get('/', cacheMiddleware(300), async (req, res) => {
  // Monster data changes infrequently — cache for 5 minutes
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  const { realmId, rarity, element, role, search, sort = 'rarity', page = '1', pageSize = '20' } = req.query as Record<string, string>

  const where: Record<string, unknown> = {}
  if (realmId) where['realmId'] = realmId
  if (rarity) where['rarity'] = rarity
  if (element) where['element'] = element
  if (role) where['role'] = role
  if (search) where['name'] = { contains: search, mode: 'insensitive' }

  const orderBy = sort === 'name' ? { name: 'asc' as const } : { createdAt: 'desc' as const }
  const skip = (Number(page) - 1) * Number(pageSize)

  const [monsters, total] = await Promise.all([
    prisma.monster.findMany({ where, include: { skills: true, realm: true }, orderBy, skip, take: Number(pageSize) }),
    prisma.monster.count({ where }),
  ])

  res.json({ data: monsters, total, page: Number(page), pageSize: Number(pageSize), hasMore: skip + monsters.length < total })
})

// GET /monsters/:id
monstersRouter.get('/:id', async (req, res) => {
  const monster = await prisma.monster.findUnique({
    where: { id: param(req.params['id']) },
    include: { skills: true, realm: true },
  })
  if (!monster) { res.status(404).json({ message: 'Monster not found' }); return }
  res.json({ data: monster })
})

// GET /user/monsters — user's collection
monstersRouter.get('/user/monsters', async (req: AuthRequest, res) => {
  const { realmId, rarity, element, role, search, sort = 'rarity', page = '1', pageSize = '20' } = req.query as Record<string, string>

  const monsterWhere: Record<string, unknown> = {}
  if (realmId) monsterWhere['realmId'] = realmId
  if (rarity) monsterWhere['rarity'] = rarity
  if (element) monsterWhere['element'] = element
  if (role) monsterWhere['role'] = role
  if (search) monsterWhere['name'] = { contains: search, mode: 'insensitive' }

  const skip = (Number(page) - 1) * Number(pageSize)

  const [userMonsters, total] = await Promise.all([
    prisma.userMonster.findMany({
      where: { userId: req.userId!, monster: monsterWhere },
      include: { monster: { include: { skills: true, realm: true } } },
      skip,
      take: Number(pageSize),
      orderBy: { acquiredAt: 'desc' },
    }),
    prisma.userMonster.count({ where: { userId: req.userId!, monster: monsterWhere } }),
  ])

  res.json({ data: userMonsters, total, page: Number(page), pageSize: Number(pageSize), hasMore: skip + userMonsters.length < total })
})

// GET /user/monsters/:id
monstersRouter.get('/user/monsters/:id', async (req: AuthRequest, res) => {
  const um = await prisma.userMonster.findFirst({
    where: { id: param(req.params['id']), userId: req.userId! },
    include: { monster: { include: { skills: true, realm: true } } },
  })
  if (!um) { res.status(404).json({ message: 'Monster not found in collection' }); return }
  res.json({ data: um })
})

// PATCH /user/monsters/:id/team
const teamAssignSchema = z.object({
  slot: z.number().int().min(1).max(5).nullable(),
}).strict()

monstersRouter.patch('/user/monsters/:id/team', async (req: AuthRequest, res) => {
  const parsed = teamAssignSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors })
    return
  }
  const { slot } = parsed.data
  const um = await prisma.userMonster.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!um) { res.status(404).json({ message: 'Monster not found' }); return }

  // If assigning to a slot, clear any existing monster in that slot
  if (slot !== null) {
    await prisma.userMonster.updateMany({
      where: { userId: req.userId!, teamSlot: slot, id: { not: um.id } },
      data: { isOnTeam: false, teamSlot: null },
    })
  }

  const updated = await prisma.userMonster.update({
    where: { id: um.id },
    data: { isOnTeam: slot !== null, teamSlot: slot },
    include: { monster: { include: { skills: true, realm: true } } },
  })
  res.json({ data: updated })
})

// PATCH /user/monsters/:id/skin
const skinAssignSchema = z.object({
  skinId: z.string().uuid().nullable(),
}).strict()

monstersRouter.patch('/user/monsters/:id/skin', async (req: AuthRequest, res) => {
  const parsed = skinAssignSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors })
    return
  }
  const { skinId } = parsed.data
  const um = await prisma.userMonster.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!um) { res.status(404).json({ message: 'Monster not found' }); return }

  const updated = await prisma.userMonster.update({
    where: { id: um.id },
    data: { equippedSkinId: skinId },
    include: { monster: { include: { skills: true, realm: true } } },
  })
  res.json({ data: updated })
})

// GET /realms
monstersRouter.get('/realms', async (_req, res) => {
  // Realm data is static — cache for 5 minutes
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  const realms = await prisma.realm.findMany({ orderBy: { number: 'asc' } })
  res.json({ data: realms })
})

// GET /user/collection-stats — owned count per realm for the authenticated user
monstersRouter.get('/user/collection-stats', async (req: AuthRequest, res) => {
  const userId = req.userId!

  // Count total monsters per realm
  const totalByRealm = await prisma.monster.groupBy({
    by: ['realmId'],
    _count: { id: true },
  })

  // Count owned monsters per realm for this user
  const ownedByRealm = await prisma.userMonster.groupBy({
    by: ['monsterId'],
    where: { userId },
    _count: { id: true },
  })

  // Get realm IDs for owned monsters
  const ownedMonsterIds = ownedByRealm.map((r: { monsterId: string }) => r.monsterId)
  const ownedMonsters = await prisma.monster.findMany({
    where: { id: { in: ownedMonsterIds } },
    select: { id: true, realmId: true },
  })

  // Build owned count per realm
  const ownedCountByRealm: Record<string, number> = {}
  for (const m of ownedMonsters) {
    ownedCountByRealm[m.realmId] = (ownedCountByRealm[m.realmId] ?? 0) + 1
  }

  const stats = totalByRealm.map((r: { realmId: string; _count: { id: number } }) => ({
    realmId: r.realmId,
    total: r._count.id,
    owned: ownedCountByRealm[r.realmId] ?? 0,
  }))

  res.json({ data: stats })
})
