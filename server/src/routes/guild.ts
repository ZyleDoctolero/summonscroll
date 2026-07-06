import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { param } from '../lib/routeUtils.js'

export const guildRouter = Router()
guildRouter.use(requireAuth)

// GET /guild/mine
guildRouter.get('/mine', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { guild: { include: { members: { select: { id: true } } } } },
  })
  if (!user?.guild) { res.json({ data: null }); return }

  const { members, ...guild } = user.guild
  res.json({ data: { ...guild, memberCount: members.length } })
})

// GET /guild — browse all guilds
guildRouter.get('/', async (_req, res) => {
  const guilds = await prisma.guild.findMany({
    include: { members: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const result = guilds.map(({ members, ...g }: { members: { id: string }[]; id: string; name: string; description: string; raidBossHp: number; raidBossMaxHp: number; createdAt: Date }) => ({ ...g, memberCount: members.length }))
  res.json({ data: result })
})

// POST /guild/:id/join
guildRouter.post('/:id/join', async (req: AuthRequest, res) => {
  const guild = await prisma.guild.findUnique({ where: { id: param(req.params['id']) } })
  if (!guild) { res.status(404).json({ message: 'Guild not found' }); return }

  await prisma.user.update({ where: { id: req.userId! }, data: { guildId: guild.id } })
  res.json({ data: { success: true } })
})

// POST /guild — create a new guild
const createGuildSchema = z.object({
  name:        z.string().min(3).max(50),
  description: z.string().max(200).default(''),
}).strict()

guildRouter.post('/', async (req: AuthRequest, res) => {
  const parsed = createGuildSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors })
    return
  }

  // Check if user is already in a guild
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { guildId: true } })
  if (user?.guildId) {
    res.status(409).json({ message: 'You are already in a guild. Leave first.' })
    return
  }

  // Check name uniqueness
  const existing = await prisma.guild.findUnique({ where: { name: parsed.data.name } })
  if (existing) {
    res.status(409).json({ message: 'A guild with that name already exists.' })
    return
  }

  const guild = await prisma.guild.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      members: { connect: { id: req.userId! } },
    },
    include: { members: { select: { id: true } } },
  })

  const { members, ...guildData } = guild
  res.status(201).json({ data: { ...guildData, memberCount: members.length } })
})

// POST /guild/leave
guildRouter.post('/leave', async (req: AuthRequest, res) => {
  await prisma.user.update({ where: { id: req.userId! }, data: { guildId: null } })
  res.json({ data: { success: true } })
})
