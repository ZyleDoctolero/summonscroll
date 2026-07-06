import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { pullRateLimiter } from '../middleware/rateLimiter.js'
import { param } from '../lib/routeUtils.js'
import { NotificationService } from '../services/notificationService.js'
import { cacheMiddleware, invalidateCache } from '../lib/cache.js'

export const bannersRouter = Router()
bannersRouter.use(requireAuth)

const BANNER_TYPES = ['standard', 'featured', 'streak', 'pact_seal', 'event'] as const
type BannerType = typeof BANNER_TYPES[number]

// Rarity tiers — no elite, no pity
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ex'] as const
type PullRarity = typeof RARITY_ORDER[number]

function isBannerType(value: unknown): value is BannerType {
  return typeof value === 'string' && BANNER_TYPES.includes(value as BannerType)
}

// Pure probability pull tables — no pity system
const PULL_RATES: Record<string, Record<PullRarity, number>> = {
  standard:  { common: 0.50, uncommon: 0.25, rare: 0.15, epic: 0.07, legendary: 0.025, mythic: 0.004, ex: 0.001 },
  featured:  { common: 0.35, uncommon: 0.22, rare: 0.25, epic: 0.12, legendary: 0.055, mythic: 0.004, ex: 0.001 },
  streak:    { common: 0.25, uncommon: 0.20, rare: 0.30, epic: 0.16, legendary: 0.070, mythic: 0.015, ex: 0.005 },
  pact_seal: { common: 0.10, uncommon: 0.15, rare: 0.25, epic: 0.22, legendary: 0.180, mythic: 0.080, ex: 0.020 },
  event:     { common: 0.35, uncommon: 0.22, rare: 0.25, epic: 0.12, legendary: 0.055, mythic: 0.004, ex: 0.001 },
}

function weightedRandom(rates: Record<PullRarity, number>): PullRarity {
  const rand = Math.random()
  let cumulative = 0
  for (const [rarity, rate] of Object.entries(rates) as [PullRarity, number][]) {
    cumulative += rate
    if (rand <= cumulative) return rarity
  }
  return 'common'
}

// GET /banners (cached for 60 seconds)
bannersRouter.get('/', cacheMiddleware(60), async (req, res) => {
  const type = req.query['type']
  if (type !== undefined && !isBannerType(type)) {
    res.status(400).json({ message: 'Invalid banner type' })
    return
  }

  const now = new Date()
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30')
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gt: now },
      ...(type ? { bannerType: type } : {}),
    },
    include: { realm: true },
    orderBy: { startsAt: 'desc' },
  })

  const featuredIds = banners
    .map((b) => b.featuredMonsterId)
    .filter((id): id is string => Boolean(id))
  const featuredMonsters = featuredIds.length > 0
    ? await prisma.monster.findMany({
        where: { id: { in: featuredIds } },
        include: { realm: true, skills: true },
      })
    : []
  const featuredById = new Map(featuredMonsters.map((m) => [m.id, m]))

  const hydratedBanners = banners.map((b) => ({
    ...b,
    featuredMonster: b.featuredMonsterId ? (featuredById.get(b.featuredMonsterId) ?? null) : null,
  }))

  res.json({ data: hydratedBanners, total: hydratedBanners.length, page: 1, pageSize: 50, hasMore: false })
})

// GET /banners/:id
bannersRouter.get('/:id', async (req: AuthRequest, res) => {
  const banner = await prisma.banner.findUnique({
    where: { id: param(req.params['id']) },
    include: { realm: true },
  })
  if (!banner) { res.status(404).json({ message: 'Banner not found' }); return }

  const featuredMonster = banner.featuredMonsterId
    ? await prisma.monster.findUnique({
        where: { id: banner.featuredMonsterId },
        include: { realm: true, skills: true },
      })
    : null

  res.json({ data: { ...banner, featuredMonster } })
})

// POST /banners/:id/pull
bannersRouter.post('/:id/pull', pullRateLimiter, async (req: AuthRequest, res) => {
  const count = ((req.body as { count?: number }).count ?? 1) as 1 | 10
  if (count !== 1 && count !== 10) {
    res.status(400).json({ message: 'Count must be 1 or 10' })
    return
  }

  const banner = await prisma.banner.findUnique({
    where: { id: param(req.params['id']) },
    include: { realm: true },
  })
  if (!banner || !banner.isActive) {
    res.status(404).json({ message: 'Banner not found or inactive' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId! } })
  if (!user) { res.status(404).json({ message: 'User not found' }); return }

  const totalCost = banner.pullCost * count
  const currencyField = banner.pullCurrency as 'spiritCrystals' | 'voidShards' | 'pactSeals'
  if (user[currencyField] < totalCost) {
    res.status(402).json({ message: `Insufficient ${banner.pullCurrency}` })
    return
  }

  // Get available monsters for this banner
  const monsters = await prisma.monster.findMany({
    where: {
      ...(banner.realmId ? { realmId: banner.realmId } : {}),
      bannerType: banner.bannerType === 'pact_seal' ? 'pact_seal' : { not: 'pact_seal' },
    },
    include: { skills: true, realm: true },
  })

  if (monsters.length === 0) {
    res.status(500).json({ message: 'No monsters available for this banner' })
    return
  }

  const rates = PULL_RATES[banner.bannerType] ?? PULL_RATES['standard']!
  const results = []

  for (let i = 0; i < count; i++) {
    // Pure probability — no pity
    const rarity = weightedRandom(rates)

    // Pick a random monster of that rarity; fall back to rare/epic pool if empty
    const pool = monsters.filter((m) => m.rarity === rarity)
    const fallback = monsters.filter((m) => ['rare', 'epic'].includes(m.rarity))
    const monster =
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]!
        : (fallback[Math.floor(Math.random() * fallback.length)] ?? monsters[0]!)

    // Check ownership
    const existing = await prisma.userMonster.findFirst({
      where: {
        userId: req.userId!,
        monsterId: monster.id,
        awakeningStage: 0,
        corruptionState: 'pure',
        rankForm: 'standard',
      },
    })

    let transcendenceStoneGranted = false
    if (existing) {
      if (monster.isEx) {
        transcendenceStoneGranted = true
        await prisma.exMonsterLog.updateMany({
          where: { monsterId: monster.id },
          data: { transcendenceStonesIssued: { increment: 1 }, timesPulled: { increment: 1 } },
        })
      }
    } else {
      await prisma.userMonster.create({
        data: { userId: req.userId!, monsterId: monster.id },
      })
      if (monster.isEx) {
        await prisma.exMonsterLog.updateMany({
          where: { monsterId: monster.id },
          data: { timesPulled: { increment: 1 }, firstPulledById: req.userId! },
        })
      }
    }

    results.push({
      monster: { ...monster, skills: monster.skills, realm: monster.realm },
      isNew: !existing,
      isDuplicate: !!existing,
      transcendenceStoneGranted,
    })
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.userId! },
    data: { [currencyField]: { decrement: totalCost } },
  })

  NotificationService.broadcastCurrencyUpdate({
    userId: req.userId!,
    spiritCrystals: updatedUser.spiritCrystals,
    voidShards: updatedUser.voidShards,
    pactSeals: updatedUser.pactSeals,
    change: { [currencyField]: -totalCost },
  })

  void invalidateCache(/^\//)

  res.json({
    data: {
      results,
      currencySpent: {
        spiritCrystals: currencyField === 'spiritCrystals' ? totalCost : 0,
        voidShards: currencyField === 'voidShards' ? totalCost : 0,
        pactSeals: currencyField === 'pactSeals' ? totalCost : 0,
      },
    },
  })
})

