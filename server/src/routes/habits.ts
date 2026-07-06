import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { param } from '../lib/routeUtils.js'

export const habitsRouter = Router()
habitsRouter.use(requireAuth)

// Reward calculation
function calcReward(difficulty: string, streak: number) {
  const base: Record<string, { crystals: number; xp: number }> = {
    trivial: { crystals: 5, xp: 10 },
    easy:    { crystals: 10, xp: 20 },
    medium:  { crystals: 20, xp: 40 },
    hard:    { crystals: 30, xp: 60 },
  }
  const b = base[difficulty] ?? base['medium']!
  const mult = Math.min(2.0, 1 + Math.floor(streak / 7) * 0.1)
  return {
    spiritCrystals: Math.round(b.crystals * mult),
    voidShards: streak > 0 && streak % 7 === 0 ? 1 : 0,
    pactSeals: streak > 0 && streak % 30 === 0 ? 1 : 0,
    xp: Math.round(b.xp * mult),
  }
}

// GET /habits
habitsRouter.get('/', async (req: AuthRequest, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId!, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: habits, total: habits.length, page: 1, pageSize: 100, hasMore: false })
})

// POST /habits
habitsRouter.post('/', async (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(1).max(100),
    category: z.enum(['study','fitness','meditation','sleep','nutrition','productivity','custom']).default('custom'),
    difficulty: z.enum(['trivial','easy','medium','hard']).default('medium'),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid input' }); return }

  const habit = await prisma.habit.create({
    data: { userId: req.userId!, ...parsed.data },
  })
  res.status(201).json({ data: habit })
})

// PATCH /habits/:id
const habitUpdateSchema = z.object({
  title:             z.string().min(1).max(100).optional(),
  category:          z.enum(['study','fitness','meditation','sleep','nutrition','productivity','custom']).optional(),
  difficulty:        z.enum(['trivial','easy','medium','hard']).optional(),
  questFrameEnabled: z.boolean().optional(),
  questDeadline:     z.string().datetime({ offset: true }).nullable().optional(),
}).strict() // reject any extra fields

habitsRouter.patch('/:id', async (req: AuthRequest, res) => {
  const habit = await prisma.habit.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!habit) { res.status(404).json({ message: 'Habit not found' }); return }

  const parsed = habitUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors })
    return
  }

  const updated = await prisma.habit.update({
    where: { id: habit.id },
    data: parsed.data,
  })
  res.json({ data: updated })
})

// DELETE /habits/:id
habitsRouter.delete('/:id', async (req: AuthRequest, res) => {
  const habit = await prisma.habit.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!habit) { res.status(404).json({ message: 'Habit not found' }); return }

  await prisma.habit.update({ where: { id: habit.id }, data: { isActive: false } })
  res.status(204).send()
})

// POST /habits/:id/complete
habitsRouter.post('/:id/complete', async (req: AuthRequest, res) => {
  const habit = await prisma.habit.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!habit) { res.status(404).json({ message: 'Habit not found' }); return }

  const direction = (req.body as { direction?: string }).direction ?? 'up'
  const newStreak = direction === 'up' ? habit.streakCount + 1 : Math.max(0, habit.streakCount - 1)
  const reward = calcReward(habit.difficulty, newStreak)

  await prisma.$transaction([
    prisma.habit.update({
      where: { id: habit.id },
      data: { streakCount: newStreak, lastCompletedAt: new Date(), streakHealth: 100 },
    }),
    prisma.user.update({
      where: { id: req.userId! },
      data: {
        spiritCrystals: { increment: reward.spiritCrystals },
        voidShards: { increment: reward.voidShards },
        pactSeals: { increment: reward.pactSeals },
        xp: { increment: reward.xp },
        currentStreak: { increment: direction === 'up' ? 1 : 0 },
      },
    }),
  ])

  // ── Bond XP distribution ──────────────────────────────────────────────────
  // If the habit has a realm affinity, distribute bond XP to all user monsters
  // whose monster belongs to that realm.
  if (habit.realmAffinity !== null && direction === 'up') {
    const BOND_XP_PER_COMPLETION = 10
    const MAX_BOND_XP = 1000

    // Find all UserMonster records for this user where the monster's realm number
    // matches the habit's realmAffinity
    const affectedMonsters = await prisma.userMonster.findMany({
      where: {
        userId: req.userId!,
        monster: {
          realm: { number: habit.realmAffinity },
        },
      },
      select: { id: true, bondXp: true },
    })

    if (affectedMonsters.length > 0) {
      await Promise.all(
        affectedMonsters.map((um: { id: string; bondXp: number }) => {
          const newBondXp = Math.min(MAX_BOND_XP, um.bondXp + BOND_XP_PER_COMPLETION)
          const newBondPercent = Math.round((newBondXp / MAX_BOND_XP) * 100)
          return prisma.userMonster.update({
            where: { id: um.id },
            data: { bondXp: newBondXp, bondPercent: newBondPercent },
          })
        }),
      )
    }
  }

  res.json({ data: { reward, newStreak } })
})

// POST /habits/harvest
habitsRouter.post('/harvest', async (req: AuthRequest, res) => {
  const dailies = await prisma.daily.findMany({
    where: { userId: req.userId!, completedToday: false },
  })

  let totalCrystals = 0, totalXp = 0, count = 0
  for (const d of dailies) {
    const r = calcReward(d.difficulty, d.streakCount)
    totalCrystals += r.spiritCrystals
    totalXp += r.xp
    count++
    await prisma.daily.update({ where: { id: d.id }, data: { completedToday: true } })
  }

  if (count > 0) {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { spiritCrystals: { increment: totalCrystals }, xp: { increment: totalXp } },
    })
  }

  res.json({ data: { totalReward: { spiritCrystals: totalCrystals, voidShards: 0, pactSeals: 0, xp: totalXp }, count } })
})

// ── Dailies ──────────────────────────────────────────────────────────────────

// GET /dailies
habitsRouter.get('/dailies', async (req: AuthRequest, res) => {
  const dailies = await prisma.daily.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: 'desc' } })
  res.json({ data: dailies, total: dailies.length, page: 1, pageSize: 100, hasMore: false })
})

// POST /dailies
habitsRouter.post('/dailies', async (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(1).max(100),
    category: z.enum(['study','fitness','meditation','sleep','nutrition','productivity','custom']).default('custom'),
    difficulty: z.enum(['trivial','easy','medium','hard']).default('medium'),
    dueTime: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid input' }); return }

  const daily = await prisma.daily.create({ data: { userId: req.userId!, ...parsed.data } })
  res.status(201).json({ data: daily })
})

// POST /dailies/:id/complete
habitsRouter.post('/dailies/:id/complete', async (req: AuthRequest, res) => {
  const daily = await prisma.daily.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!daily) { res.status(404).json({ message: 'Daily not found' }); return }
  if (daily.completedToday) { res.status(409).json({ message: 'Already completed today' }); return }

  const reward = calcReward(daily.difficulty, daily.streakCount + 1)
  await prisma.$transaction([
    prisma.daily.update({ where: { id: daily.id }, data: { completedToday: true, streakCount: { increment: 1 } } }),
    prisma.user.update({ where: { id: req.userId! }, data: { spiritCrystals: { increment: reward.spiritCrystals }, xp: { increment: reward.xp } } }),
  ])
  res.json({ data: { reward } })
})

// ── Todos ────────────────────────────────────────────────────────────────────

// GET /todos
habitsRouter.get('/todos', async (req: AuthRequest, res) => {
  const todos = await prisma.todo.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: 'desc' } })
  res.json({ data: todos, total: todos.length, page: 1, pageSize: 100, hasMore: false })
})

// POST /todos
habitsRouter.post('/todos', async (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(1).max(100),
    difficulty: z.enum(['trivial','easy','medium','hard']).default('medium'),
    dueDate: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid input' }); return }

  const todo = await prisma.todo.create({ data: { userId: req.userId!, ...parsed.data } })
  res.status(201).json({ data: todo })
})

// POST /todos/:id/complete
habitsRouter.post('/todos/:id/complete', async (req: AuthRequest, res) => {
  const todo = await prisma.todo.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!todo) { res.status(404).json({ message: 'Todo not found' }); return }
  if (todo.isCompleted) { res.status(409).json({ message: 'Already completed' }); return }

  const reward = calcReward(todo.difficulty, 0)
  await prisma.$transaction([
    prisma.todo.update({ where: { id: todo.id }, data: { isCompleted: true } }),
    prisma.user.update({ where: { id: req.userId! }, data: { spiritCrystals: { increment: reward.spiritCrystals }, xp: { increment: reward.xp } } }),
  ])
  res.json({ data: { reward } })
})

// DELETE /todos/:id
habitsRouter.delete('/todos/:id', async (req: AuthRequest, res) => {
  const todo = await prisma.todo.findFirst({ where: { id: param(req.params['id']), userId: req.userId! } })
  if (!todo) { res.status(404).json({ message: 'Todo not found' }); return }
  await prisma.todo.delete({ where: { id: todo.id } })
  res.status(204).send()
})
