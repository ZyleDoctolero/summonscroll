import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

export const userRouter = Router()
userRouter.use(requireAuth)

/**
 * GET /user/export
 * Returns a portable JSON bundle of all data belonging to the authenticated user.
 * Complies with data portability requirements (GDPR Art. 20, CCPA).
 *
 * Sensitive fields (passwordHash, refreshToken) are excluded.
 */
userRouter.get('/export', async (req: AuthRequest, res) => {
  const userId = req.userId!

  const [user, habits, dailies, todos, userMonsters, battleResults, loginRewards] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          level: true,
          xp: true,
          xpToNextLevel: true,
          spiritCrystals: true,
          voidShards: true,
          pactSeals: true,
          currentStreak: true,
          longestStreak: true,
          avatarUrl: true,
          guildId: true,
          createdAt: true,
          updatedAt: true,
          // Exclude: passwordHash, refreshToken
        },
      }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.daily.findMany({ where: { userId } }),
      prisma.todo.findMany({ where: { userId } }),
      prisma.userMonster.findMany({
        where: { userId },
        include: { monster: { select: { name: true, rarity: true, element: true } } },
      }),
      prisma.battleResult.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 500, // cap to last 500 battles
      }),
      prisma.loginReward.findMany({ where: { userId } }),
    ])

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const exportBundle = {
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
    user,
    habits,
    dailies,
    todos,
    monsters: userMonsters,
    battleResults,
    loginRewards,
  }

  // Set headers for file download
  res.setHeader('Content-Type', 'application/json')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="summonscroll-export-${userId.slice(0, 8)}.json"`,
  )
  res.json(exportBundle)
})
