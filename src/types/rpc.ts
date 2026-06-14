export interface ScoreTaskResult {
  success: boolean;
  message: string;
  gold_gained: number;
  xp_gained: number;
  hp_lost: number;
  died: boolean;
  drops: Drop[];
  crystal_gained: boolean;
  bond_ticks: GrowthTick[];
}

export interface GrowthTick {
  monster_id: string;
  bond_gained: number;
  xp_gained: number;
}

export interface Drop {
  item_id: string;
  name: string;
  quantity: number;
  type: string;
  rarity: string;
}

export interface PullResult {
  success: boolean;
  monsters: any[];
}

export interface AscendResult {
  success: boolean;
  new_level: number;
}

export interface CronResult {
  success: boolean;
  days_missed: number;
  damage_taken: number;
  died: boolean;
  streak_broken: boolean;
}

export type BattleStartResult = {
  battleId: string;
  mode: 'auto' | 'manual';
  initialState: BattleState;
};

export type BattleState = {
  playerHp: number;
  enemyHp: number;
  turn: number;
  log: any[];
  complete: boolean;
  won: boolean | null;
  goldEarned: number;
  specialCooldown?: number;
};

export type HarvestResult = {
  harvested: number;
  whisperName: string | null;
};
