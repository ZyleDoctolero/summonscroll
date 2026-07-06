import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

export const battlesRouter = Router()
battlesRouter.use(requireAuth)

// ── Power calculation (server-authoritative) ──────────────────────────────────
const AWAKENING_MULTIPLIERS = [1.0, 1.15, 1.32, 1.52, 1.75, 2.0]
const RANK_MULTIPLIERS: Record<string, number> = {
  standard: 1.0,
  champion: 1.3,
  sovereign: 1.6,
}
const CORRUPTION_MULTIPLIERS: Record<string, number> = {
  pure:      1.0,
  corrupted: 1.1,
  divine:    1.2,
  hollow:    0.8,
}

interface MonsterPowerInput {
  baseAtk: number
  baseDef: number
  baseHp: number
  level: number
  bondPercent: number
  awakeningStage: number
  rankForm: string
  corruptionState: string
}

function calculateMonsterPower(um: MonsterPowerInput): number {
  const basePower = um.baseAtk + um.baseDef + um.baseHp / 10
  const levelMult = 1 + (um.level - 1) * 0.05
  const bondMult = 0.5 + (um.bondPercent / 100) * 0.5
  const awakeningMult = AWAKENING_MULTIPLIERS[um.awakeningStage] ?? 1.0
  const rankMult = RANK_MULTIPLIERS[um.rankForm] ?? 1.0
  const corruptionMult = CORRUPTION_MULTIPLIERS[um.corruptionState] ?? 1.0
  const fatigueMult = um.bondPercent === 0 ? 0.5 : 1.0

  return Math.round(
    basePower * levelMult * bondMult * awakeningMult * rankMult * corruptionMult * fatigueMult,
  )
}

// ── Battle simulation ─────────────────────────────────────────────────────────
interface BattleLogEntry {
  round: number
  actor: 'player' | 'enemy'
  action: string
  damage: number
  remainingHp: number
}

interface BattleState {
  round: number
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  log: BattleLogEntry[]
  isOver: boolean
  playerWon: boolean | null
}

interface EnemyConfig {
  name: string
  hp: number
  atk: number
  def: number
}

function generateEnemy(mode: string, floor: number): EnemyConfig {
  const scale = 1 + (floor - 1) * 0.1
  const modeMultipliers: Record<string, number> = {
    dungeon:     1.0,
    chaos_tower: 1.5,
    guild_raid:  3.0,
    event:       1.2,
  }
  const mult = (modeMultipliers[mode] ?? 1.0) * scale
  return {
    name: mode === 'guild_raid' ? 'Raid Boss' : `Floor ${floor} Guardian`,
    hp:   Math.round(5000 * mult),
    atk:  Math.round(80 * mult),
    def:  Math.round(40 * mult),
  }
}

function simulateBattle(
  teamPower: number,
  teamHp: number,
  enemy: EnemyConfig,
): BattleState {
  let playerHp = Math.round(teamHp)
  let enemyHp = enemy.hp
  const log: BattleLogEntry[] = []
  let round = 0

  while (playerHp > 0 && enemyHp > 0 && round < 50) {
    round++

    const playerDmg = Math.max(1, Math.round(teamPower - enemy.def * 0.3))
    enemyHp = Math.max(0, enemyHp - playerDmg)
    log.push({ round, actor: 'player', action: 'Team Attack', damage: playerDmg, remainingHp: enemyHp })

    if (enemyHp <= 0) break

    const enemyDmg = Math.max(1, Math.round(enemy.atk - teamPower * 0.005))
    playerHp = Math.max(0, playerHp - enemyDmg)
    log.push({ round, actor: 'enemy', action: `${enemy.name} attacks`, damage: enemyDmg, remainingHp: playerHp })
  }

  return {
    round,
    playerHp,
    playerMaxHp: Math.round(teamHp),
    enemyHp,
    enemyMaxHp: enemy.hp,
    log,
    isOver: playerHp <= 0 || enemyHp <= 0,
    playerWon: enemyHp <= 0,
  }
}

function calculateRewards(won: boolean, floor: number) {
  if (!won) return { spiritCrystals: 5, voidShards: 0, pactSeals: 0, xp: 10 }
  const base = Math.floor(floor / 5) + 1
  return {
    spiritCrystals: base * 15,
    voidShards: floor % 10 === 0 ? 1 : 0,
    pactSeals: 0,
    xp: base * 30,
  }
}

// ── POST /battles/start ───────────────────────────────────────────────────────
const startBattleSchema = z.object({
  teamMonsterIds: z.array(z.string().uuid()).min(1).max(5),
  mode: z.enum(['dungeon', 'chaos_tower', 'guild_raid', 'event']).default('dungeon'),
  floor: z.number().int().min(1).max(100).default(1),
})

battlesRouter.post('/start', async (req: AuthRequest, res) => {
  const parsed = startBattleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors })
    return
  }

  const { teamMonsterIds, mode, floor } = parsed.data

  // Load the user's monsters — verify ownership
  const userMonsters = await prisma.userMonster.findMany({
    where: {
      id: { in: teamMonsterIds },
      userId: req.userId!,
    },
    include: {
      monster: true,
    },
  })

  if (userMonsters.length === 0) {
    res.status(400).json({ message: 'No valid team monsters found' })
    return
  }

  // Calculate team stats server-side
  const teamPower = userMonsters.reduce((sum: number, um: typeof userMonsters[0]) => {
    return sum + calculateMonsterPower({
      baseAtk: um.monster.baseAtk,
      baseDef: um.monster.baseDef,
      baseHp:  um.monster.baseHp,
      level:   um.level,
      bondPercent: um.bondPercent,
      awakeningStage: um.awakeningStage,
      rankForm: um.rankForm,
      corruptionState: um.corruptionState,
    })
  }, 0)

  const teamHp = userMonsters.reduce(
    (sum: number, um: typeof userMonsters[0]) => sum + um.monster.baseHp * (1 + um.level * 0.05),
    0,
  )

  const enemy = generateEnemy(mode, floor)
  const battleState = simulateBattle(teamPower, teamHp, enemy)
  const rewards = calculateRewards(battleState.playerWon ?? false, floor)

  // Persist the battle result
  const battleResult = await prisma.battleResult.create({
    data: {
      userId: req.userId!,
      mode,
      won: battleState.playerWon ?? false,
      floorReached: floor,
      crystalsEarned: rewards.spiritCrystals,
      shardsEarned: rewards.voidShards,
      xpEarned: rewards.xp,
    },
  })

  // Grant rewards to the user
  if (rewards.spiritCrystals > 0 || rewards.voidShards > 0 || rewards.xp > 0) {
    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        spiritCrystals: { increment: rewards.spiritCrystals },
        voidShards:     { increment: rewards.voidShards },
        pactSeals:      { increment: rewards.pactSeals },
        xp:             { increment: rewards.xp },
      },
    })
  }

  res.json({
    data: {
      battleState,
      rewards,
      battleResultId: battleResult.id,
      enemy: { name: enemy.name, hp: enemy.hp },
    },
  })
})

// ── GET /battles/history ──────────────────────────────────────────────────────
battlesRouter.get('/history', async (req: AuthRequest, res) => {
  const results = await prisma.battleResult.findMany({
    where: { userId: req.userId! },
    orderBy: { completedAt: 'desc' },
    take: 20,
  })
  res.json({ data: results, total: results.length })
})
