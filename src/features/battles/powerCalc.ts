import type { UserMonster } from '@/types'

const AWAKENING_MULTIPLIERS = [1.0, 1.15, 1.32, 1.52, 1.75, 2.0]
const RANK_MULTIPLIERS = { standard: 1.0, champion: 1.3, sovereign: 1.6 }
const CORRUPTION_MULTIPLIERS = {
  pure:      1.0,
  corrupted: 1.1,
  divine:    1.2,
  hollow:    0.8,
}

/**
 * Calculate a monster's effective combat power.
 * Formula: base × level × bond × awakening × rank × corruption × fatigue
 */
export function calculateMonsterPower(um: UserMonster): number {
  const { monster, level, bondPercent, awakeningStage, rankForm, corruptionState } = um

  const basePower = monster.baseAtk + monster.baseDef + monster.baseHp / 10

  const levelMult = 1 + (level - 1) * 0.05
  const bondMult = 0.5 + (bondPercent / 100) * 0.5  // 50%–100% based on bond
  const awakeningMult = AWAKENING_MULTIPLIERS[awakeningStage]
  const rankMult = RANK_MULTIPLIERS[rankForm]
  const corruptionMult = CORRUPTION_MULTIPLIERS[corruptionState]

  // Fatigue: if bond is 0, monster is fatigued — 50% power penalty
  const fatigueMult = bondPercent === 0 ? 0.5 : 1.0

  return Math.round(
    basePower *
    levelMult *
    bondMult *
    awakeningMult *
    rankMult *
    corruptionMult *
    fatigueMult,
  )
}

/**
 * Calculate total team power.
 */
export function calculateTeamPower(team: UserMonster[]): number {
  return team.reduce((sum, um) => sum + calculateMonsterPower(um), 0)
}
