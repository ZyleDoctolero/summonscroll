import type { UserMonster, CurrencyReward } from '@/types'
import { calculateMonsterPower } from './powerCalc'

export interface BattleState {
  round: number
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  log: BattleLogEntry[]
  isOver: boolean
  playerWon: boolean | null
}

export interface BattleLogEntry {
  round: number
  actor: 'player' | 'enemy'
  action: string
  damage: number
  remainingHp: number
}

export interface EnemyConfig {
  name: string
  hp: number
  atk: number
  def: number
}

/**
 * Run a complete auto-battle simulation.
 * Server-authoritative in production — this is the client-side preview.
 */
export function simulateBattle(
  team: UserMonster[],
  enemy: EnemyConfig,
): BattleState {
  const teamPower = team.reduce((sum, um) => sum + calculateMonsterPower(um), 0)
  const teamHp = team.reduce((sum, um) => sum + um.monster.baseHp * (1 + um.level * 0.05), 0)

  let playerHp = Math.round(teamHp)
  let enemyHp = enemy.hp
  const log: BattleLogEntry[] = []
  let round = 0

  while (playerHp > 0 && enemyHp > 0 && round < 50) {
    round++

    // Player attacks
    const playerDmg = Math.max(1, Math.round(teamPower / team.length - enemy.def * 0.3))
    enemyHp = Math.max(0, enemyHp - playerDmg)
    log.push({
      round,
      actor: 'player',
      action: 'Team Attack',
      damage: playerDmg,
      remainingHp: enemyHp,
    })

    if (enemyHp <= 0) break

    // Enemy attacks
    const enemyDmg = Math.max(1, Math.round(enemy.atk - teamPower * 0.01))
    playerHp = Math.max(0, playerHp - enemyDmg)
    log.push({
      round,
      actor: 'enemy',
      action: `${enemy.name} attacks`,
      damage: enemyDmg,
      remainingHp: playerHp,
    })
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

/**
 * Calculate battle rewards based on outcome.
 */
export function calculateBattleRewards(
  won: boolean,
  floorOrLevel: number,
): CurrencyReward {
  if (!won) {
    return { spiritCrystals: 5, voidShards: 0, pactSeals: 0, xp: 10 }
  }

  const base = Math.floor(floorOrLevel / 5) + 1
  return {
    spiritCrystals: base * 15,
    voidShards: floorOrLevel % 10 === 0 ? 1 : 0,
    pactSeals: 0,
    xp: base * 30,
  }
}
