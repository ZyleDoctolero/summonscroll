import { api } from '@/lib/api'
import type { ApiResponse, BattleMode } from '@/types'

export interface BattleLogEntry {
  round: number
  actor: 'player' | 'enemy'
  action: string
  damage: number
  remainingHp: number
}

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

export interface BattleRewards {
  spiritCrystals: number
  voidShards: number
  pactSeals: number
  xp: number
}

export interface StartBattleRequest {
  teamMonsterIds: string[]
  mode: BattleMode
  floor: number
}

export interface StartBattleResponse {
  battleState: BattleState
  rewards: BattleRewards
  battleResultId: string
  enemy: { name: string; hp: number }
}

export const battlesApi = {
  startBattle: (data: StartBattleRequest) =>
    api.post<ApiResponse<StartBattleResponse>>('/battles/start', data),

  getHistory: () => api.get<ApiResponse<unknown[]>>('/battles/history'),
}
