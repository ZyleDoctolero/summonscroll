import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

export const achievementsRouter = Router()
achievementsRouter.use(requireAuth)

interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  check: (stats: UserStats) => boolean
  progressValue: (stats: UserStats) => number
  progressMax: number
}

interface UserStats {
  level: number
  totalHabits: number
  longestStreak: number
  currentStreak: number
  totalMonsters: number
  totalBattles: number
  battlesWon: number
  totalPulls: number
  guildId: string | null
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_habit',
    name: 'First Steps',
    description: 'Create your first habit',
    icon: '📜',
    check: (s) => s.totalHabits >= 1,
    progressValue: (s) => Math.min(s.totalHabits, 1),
    progressMax: 1,
  },
  {
    id: 'habit_veteran',
    name: 'Habit Veteran',
    description: 'Create 10 habits',
    icon: '⚔',
    check: (s) => s.totalHabits >= 10,
    progressValue: (s) => Math.min(s.totalHabits, 10),
    progressMax: 10,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: '🔥',
    check: (s) => s.longestStreak >= 7,
    progressValue: (s) => Math.min(s.longestStreak, 7),
    progressMax: 7,
  },
  {
    id: 'streak_30',
    name: 'Monthly Champion',
    description: 'Reach a 30-day streak',
    icon: '🏆',
    check: (s) => s.longestStreak >= 30,
    progressValue: (s) => Math.min(s.longestStreak, 30),
    progressMax: 30,
  },
  {
    id: 'first_summon',
    name: 'First Summon',
    description: 'Summon your first monster',
    icon: '⛩',
    check: (s) => s.totalMonsters >= 1,
    progressValue: (s) => Math.min(s.totalMonsters, 1),
    progressMax: 1,
  },
  {
    id: 'collector_10',
    name: 'Budding Collector',
    description: 'Collect 10 monsters',
    icon: '📖',
    check: (s) => s.totalMonsters >= 10,
    progressValue: (s) => Math.min(s.totalMonsters, 10),
    progressMax: 10,
  },
  {
    id: 'collector_50',
    name: 'Veteran Summoner',
    description: 'Collect 50 monsters',
    icon: '🌟',
    check: (s) => s.totalMonsters >= 50,
    progressValue: (s) => Math.min(s.totalMonsters, 50),
    progressMax: 50,
  },
  {
    id: 'first_battle',
    name: 'Into the Fray',
    description: 'Complete your first battle',
    icon: '⚔',
    check: (s) => s.totalBattles >= 1,
    progressValue: (s) => Math.min(s.totalBattles, 1),
    progressMax: 1,
  },
  {
    id: 'battle_winner',
    name: 'Victor',
    description: 'Win 10 battles',
    icon: '🏅',
    check: (s) => s.battlesWon >= 10,
    progressValue: (s) => Math.min(s.battlesWon, 10),
    progressMax: 10,
  },
  {
    id: 'level_10',
    name: 'Rising Power',
    description: 'Reach level 10',
    icon: '⬆',
    check: (s) => s.level >= 10,
    progressValue: (s) => Math.min(s.level, 10),
    progressMax: 10,
  },
  {
    id: 'guild_member',
    name: 'Vanguard',
    description: 'Join a guild',
    icon: '🛡',
    check: (s) => s.guildId !== null,
    progressValue: (s) => s.guildId ? 1 : 0,
    progressMax: 1,
  },
]

// GET /achievements
achievementsRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId!

  const [user, habitCount, monsterCount, battleResults] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, longestStreak: true, currentStreak: true, guildId: true },
    }),
    prisma.habit.count({ where: { userId, isActive: true } }),
    prisma.userMonster.count({ where: { userId } }),
    prisma.battleResult.findMany({
      where: { userId },
      select: { won: true },
    }),
  ])

  if (!user) { res.status(404).json({ message: 'User not found' }); return }

  const stats: UserStats = {
    level: user.level,
    totalHabits: habitCount,
    longestStreak: user.longestStreak,
    currentStreak: user.currentStreak,
    totalMonsters: monsterCount,
    totalBattles: battleResults.length,
    battlesWon: battleResults.filter((b: { won: boolean }) => b.won).length,
    totalPulls: monsterCount, // approximation
    guildId: user.guildId,
  }

  const achievements = ACHIEVEMENT_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    isUnlocked: def.check(stats),
    progress: def.progressValue(stats),
    progressMax: def.progressMax,
    unlockedAt: def.check(stats) ? new Date().toISOString() : null,
  }))

  res.json({ data: achievements, total: achievements.length })
})
