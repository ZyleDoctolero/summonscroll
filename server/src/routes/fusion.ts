import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

export const fusionRouter = Router()
fusionRouter.use(requireAuth)

const ELEMENT_FUSION: Record<string, Record<string, { rarity: string; element: string }>> = {
  fire:  { fire: { rarity: '+1', element: 'fire' }, water: { rarity: 'same', element: 'earth' } },
  light: { dark: { rarity: '+1', element: 'void' } },
  void:  { digital: { rarity: 'same', element: 'stellar' } },
  death: { nature: { rarity: '+1', element: 'primordial' } },
}

// POST /fusion/preview
fusionRouter.post('/preview', async (req: AuthRequest, res) => {
  const schema = z.object({ ingredientIds: z.array(z.string()).min(2).max(3) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid input' }); return }

  const { ingredientIds } = parsed.data

  // Check user owns all ingredients
  const userMonsters = await prisma.userMonster.findMany({
    where: { id: { in: ingredientIds }, userId: req.userId! },
    include: { monster: true },
  })
  if (userMonsters.length !== ingredientIds.length) {
    res.status(400).json({ message: 'One or more monsters not found in your collection' })
    return
  }

  // Look for named recipe
  const monsterIds = userMonsters.map((um: { monsterId: string }) => um.monsterId)
  const recipe = await prisma.fusionRecipe.findFirst({
    where: {
      ingredients: { every: { monsterId: { in: monsterIds } } },
    },
    include: { resultMonster: { include: { skills: true, realm: true } }, ingredients: true },
  })

  if (recipe) {
    res.json({
      data: {
        resultMonster: recipe.resultMonster,
        isCrossRealm: recipe.isCrossRealm,
        successRate: recipe.successRate,
        isNamedRecipe: true,
        elementResult: null,
        rarityResult: null,
      },
    })
    return
  }

  // Elemental fusion fallback
  const elements = userMonsters.map((um: { monster: { element: string } }) => um.monster.element)
  const el1 = elements[0] ?? 'fire'
  const el2 = elements[1] ?? 'fire'
  const elementResult = ELEMENT_FUSION[el1]?.[el2] ?? null

  res.json({
    data: {
      resultMonster: null,
      isCrossRealm: false,
      successRate: 100,
      isNamedRecipe: false,
      elementResult: elementResult?.element ?? null,
      rarityResult: elementResult?.rarity ?? null,
    },
  })
})

// POST /fusion/perform
fusionRouter.post('/perform', async (req: AuthRequest, res) => {
  const schema = z.object({ ingredientIds: z.array(z.string()).min(2).max(3) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Invalid input' }); return }

  const { ingredientIds } = parsed.data

  const userMonsters = await prisma.userMonster.findMany({
    where: { id: { in: ingredientIds }, userId: req.userId! },
    include: { monster: true },
  })
  if (userMonsters.length !== ingredientIds.length) {
    res.status(400).json({ message: 'One or more monsters not found' })
    return
  }

  const monsterIds = userMonsters.map((um: { monsterId: string }) => um.monsterId)
  const recipe = await prisma.fusionRecipe.findFirst({
    where: { ingredients: { every: { monsterId: { in: monsterIds } } } },
    include: { resultMonster: { include: { skills: true, realm: true } }, ingredients: true },
  })

  if (!recipe) {
    res.status(400).json({ message: 'No fusion recipe found for these monsters' })
    return
  }

  // Check success rate
  if (Math.random() * 100 > recipe.successRate) {
    // Failed — consume ingredients, no result
    await prisma.userMonster.deleteMany({ where: { id: { in: ingredientIds } } })
    res.status(422).json({ message: 'Fusion failed. Ingredients consumed.' })
    return
  }

  // Consume ingredients and create result
  await prisma.userMonster.deleteMany({ where: { id: { in: ingredientIds } } })
  await prisma.userMonster.create({
    data: { userId: req.userId!, monsterId: recipe.resultMonsterId },
  })

  res.json({ data: { resultMonster: recipe.resultMonster, consumed: ingredientIds } })
})
