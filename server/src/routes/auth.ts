import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

export const authRouter = Router()

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /auth/register
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() })
    return
  }

  const { username, email, password } = parsed.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) {
    res.status(409).json({ message: 'Username or email already taken' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
    select: {
      id: true, username: true, email: true, level: true, xp: true,
      xpToNextLevel: true, spiritCrystals: true, voidShards: true,
      pactSeals: true, currentStreak: true, longestStreak: true,
      avatarUrl: true, guildId: true, createdAt: true,
    },
  })

  const tokens = {
    accessToken: signAccessToken({ userId: user.id, username: user.username }),
    refreshToken: signRefreshToken({ userId: user.id, username: user.username }),
    expiresIn: 900,
  }

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } })

  res.status(201).json({ data: { user, tokens } })
})

// POST /auth/login
authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input' })
    return
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const tokens = {
    accessToken: signAccessToken({ userId: user.id, username: user.username }),
    refreshToken: signRefreshToken({ userId: user.id, username: user.username }),
    expiresIn: 900,
  }

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } })

  const { passwordHash: _, refreshToken: __, ...safeUser } = user
  res.json({ data: { user: safeUser, tokens } })
})

// POST /auth/refresh
authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string }
  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token required' })
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ message: 'Invalid refresh token' })
      return
    }

    const tokens = {
      accessToken: signAccessToken({ userId: user.id, username: user.username }),
      refreshToken: signRefreshToken({ userId: user.id, username: user.username }),
      expiresIn: 900,
    }
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } })
    res.json({ data: tokens })
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
})

// GET /auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, username: true, email: true, level: true, xp: true,
      xpToNextLevel: true, spiritCrystals: true, voidShards: true,
      pactSeals: true, currentStreak: true, longestStreak: true,
      avatarUrl: true, guildId: true, createdAt: true,
    },
  })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  res.json({ data: user })
})

// POST /auth/logout
authRouter.post('/logout', requireAuth, async (req: AuthRequest, res) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { refreshToken: null },
  })
  res.status(204).send()
})

// POST /auth/login-reward
// Claims the daily login reward for the current 7-day cycle.
authRouter.post('/login-reward', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const now = new Date()

  // Find the start of the current 7-day cycle (Monday of current week, UTC)
  const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon...
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - daysSinceMonday)
  weekStart.setUTCHours(0, 0, 0, 0)

  // Count how many rewards claimed this cycle
  const claimedThisCycle = await prisma.loginReward.findMany({
    where: { userId, weekStart },
    orderBy: { day: 'asc' },
  })

  const nextDay = claimedThisCycle.length + 1

  // Already claimed today?
  const today = new Date(now)
  today.setUTCHours(0, 0, 0, 0)
  const claimedToday = claimedThisCycle.some((r: { claimedAt: Date }) => {
    const claimedDate = new Date(r.claimedAt)
    claimedDate.setUTCHours(0, 0, 0, 0)
    return claimedDate.getTime() === today.getTime()
  })

  if (claimedToday) {
    res.status(409).json({ message: 'Login reward already claimed today' })
    return
  }

  if (nextDay > 7) {
    res.status(409).json({ message: 'All rewards claimed for this cycle' })
    return
  }

  // Reward table: day 7 always gives a Pact Seal
  const REWARDS: Record<number, { spiritCrystals: number; voidShards: number; pactSeals: number }> = {
    1: { spiritCrystals: 20,  voidShards: 0, pactSeals: 0 },
    2: { spiritCrystals: 20,  voidShards: 0, pactSeals: 0 },
    3: { spiritCrystals: 0,   voidShards: 1, pactSeals: 0 },
    4: { spiritCrystals: 30,  voidShards: 0, pactSeals: 0 },
    5: { spiritCrystals: 30,  voidShards: 0, pactSeals: 0 },
    6: { spiritCrystals: 50,  voidShards: 0, pactSeals: 0 },
    7: { spiritCrystals: 100, voidShards: 2, pactSeals: 1 },
  }

  const reward = REWARDS[nextDay]!

  await prisma.$transaction([
    prisma.loginReward.create({ data: { userId, day: nextDay, weekStart } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        spiritCrystals: { increment: reward.spiritCrystals },
        voidShards:     { increment: reward.voidShards },
        pactSeals:      { increment: reward.pactSeals },
      },
    }),
  ])

  res.json({ data: { day: nextDay, reward, nextDay: nextDay < 7 ? nextDay + 1 : null } })
})

// GET /auth/login-reward/status
authRouter.get('/login-reward/status', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const now = new Date()

  const dayOfWeek = now.getUTCDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - daysSinceMonday)
  weekStart.setUTCHours(0, 0, 0, 0)

  const claimedThisCycle = await prisma.loginReward.findMany({
    where: { userId, weekStart },
    orderBy: { day: 'asc' },
  })

  const today = new Date(now)
  today.setUTCHours(0, 0, 0, 0)
  const claimedToday = claimedThisCycle.some((r: { claimedAt: Date }) => {
    const d = new Date(r.claimedAt)
    d.setUTCHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  res.json({
    data: {
      claimedDays: claimedThisCycle.map((r: { day: number }) => r.day),
      nextDay: claimedThisCycle.length + 1,
      canClaimToday: !claimedToday && claimedThisCycle.length < 7,
    },
  })
})
