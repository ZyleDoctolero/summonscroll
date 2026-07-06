// ─── Rarity ───────────────────────────────────────────────────────────────────
export type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'elite'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'ex'

// ─── Element ──────────────────────────────────────────────────────────────────
export type Element =
  | 'fire'
  | 'water'
  | 'earth'
  | 'wind'
  | 'light'
  | 'dark'
  | 'void'
  | 'digital'
  | 'ice'
  | 'thunder'
  | 'nature'
  | 'stellar'
  | 'primordial'
  | 'synthetic'
  | 'arcane'
  | 'chaos'
  | 'dread'
  | 'death'
  | 'divine'

// ─── Monster Role ─────────────────────────────────────────────────────────────
export type MonsterRole = 'attacker' | 'tank' | 'healer' | 'debuffer' | 'support'

// ─── Awakening Stage ──────────────────────────────────────────────────────────
export type AwakeningStage = 0 | 1 | 2 | 3 | 4 | 5

// ─── Corruption State ─────────────────────────────────────────────────────────
export type CorruptionState = 'pure' | 'corrupted' | 'divine' | 'hollow'

// ─── Rank Form ────────────────────────────────────────────────────────────────
export type RankForm = 'standard' | 'champion' | 'sovereign'

// ─── Banner Type ──────────────────────────────────────────────────────────────
export type BannerType = 'standard' | 'featured' | 'streak' | 'pact_seal' | 'event'

// ─── Habit Difficulty ─────────────────────────────────────────────────────────
export type HabitDifficulty = 'trivial' | 'easy' | 'medium' | 'hard'

// ─── Habit Category ───────────────────────────────────────────────────────────
export type HabitCategory =
  | 'study'
  | 'fitness'
  | 'meditation'
  | 'sleep'
  | 'nutrition'
  | 'productivity'
  | 'custom'

// ─── Realm ────────────────────────────────────────────────────────────────────
export interface Realm {
  id: string
  number: number
  name: string
  slug: string
  element: Element
  habitAffinity: HabitCategory[]
  description: string
  colorHex: string
}

// ─── Monster (base) ───────────────────────────────────────────────────────────
export interface Monster {
  id: string
  name: string
  realmId: string
  realm?: Realm
  rarity: Rarity
  role: MonsterRole
  element: Element
  origin: string
  lore: string
  artUrl: string | null
  isEx: boolean
  realmSkill: string | null
  baseHp: number
  baseAtk: number
  baseDef: number
  baseSpd: number
  skills: Skill[]
  bannerType: BannerType
  createdAt: string
}

// ─── Skill ────────────────────────────────────────────────────────────────────
export interface Skill {
  id: string
  name: string
  description: string
  slot: 1 | 2 | 3 | 4
  unlockBondPercent: number // 0 = always unlocked
  cooldown: number
  element: Element | null
}

// ─── User Monster (owned) ─────────────────────────────────────────────────────
export interface UserMonster {
  id: string
  userId: string
  monsterId: string
  monster: Monster
  level: number
  awakeningStage: AwakeningStage
  corruptionState: CorruptionState
  rankForm: RankForm
  bondXp: number
  bondPercent: number
  equippedSkinId: string | null
  isOnTeam: boolean
  teamSlot: number | null
  acquiredAt: string
}

// ─── Monster Skin ─────────────────────────────────────────────────────────────
export type SkinType = 'seasonal' | 'event' | 'achievement' | 'default'

export interface MonsterSkin {
  id: string
  monsterId: string
  skinName: string
  skinType: SkinType
  isSeasonal: boolean
  unlockCondition: string | null
  artUrl: string | null
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  username: string
  email: string
  level: number
  xp: number
  xpToNextLevel: number
  spiritCrystals: number
  voidShards: number
  pactSeals: number
  currentStreak: number
  longestStreak: number
  avatarUrl: string | null
  guildId: string | null
  createdAt: string
}

// ─── Habit ────────────────────────────────────────────────────────────────────
export interface Habit {
  id: string
  userId: string
  title: string
  category: HabitCategory
  difficulty: HabitDifficulty
  streakCount: number
  streakHealth: number // 0–100
  lastCompletedAt: string | null
  isActive: boolean
  questFrameEnabled: boolean
  questDeadline: string | null
  realmAffinity: number | null // realm number 1–12
  createdAt: string
}

// ─── Daily ────────────────────────────────────────────────────────────────────
export interface Daily {
  id: string
  userId: string
  title: string
  category: HabitCategory
  difficulty: HabitDifficulty
  completedToday: boolean
  streakCount: number
  dueTime: string | null
  createdAt: string
}

// ─── Todo ─────────────────────────────────────────────────────────────────────
export interface Todo {
  id: string
  userId: string
  title: string
  difficulty: HabitDifficulty
  isCompleted: boolean
  dueDate: string | null
  createdAt: string
}

// ─── Currency Reward ──────────────────────────────────────────────────────────
export interface CurrencyReward {
  spiritCrystals: number
  voidShards: number
  pactSeals: number
  xp: number
}

// ─── Banner ───────────────────────────────────────────────────────────────────
export interface Banner {
  id: string
  name: string
  bannerType: BannerType
  realmId: string | null
  realm?: Realm
  featuredMonsterId: string | null
  featuredMonster?: Monster
  artUrl: string | null
  startsAt: string
  endsAt: string
  isActive: boolean
  pullCost: number
  pullCurrency: 'spiritCrystals' | 'voidShards' | 'pactSeals'
}

// ─── Pull Result ──────────────────────────────────────────────────────────────
export interface PullResult {
  monster: Monster
  isNew: boolean
  isDuplicate: boolean
  transcendenceStoneGranted: boolean
}

// ─── Battle ───────────────────────────────────────────────────────────────────
export type BattleMode = 'dungeon' | 'chaos_tower' | 'guild_raid' | 'event'

export interface BattleResult {
  id: string
  userId: string
  mode: BattleMode
  won: boolean
  floorReached: number | null
  rewards: CurrencyReward
  completedAt: string
}

// ─── Fusion Recipe ────────────────────────────────────────────────────────────
export interface FusionRecipe {
  id: string
  ingredientIds: string[]
  resultMonsterId: string
  resultMonster?: Monster
  isCrossRealm: boolean
  successRate: number
}

// ─── Guild ────────────────────────────────────────────────────────────────────
export interface Guild {
  id: string
  name: string
  description: string
  memberCount: number
  raidBossHp: number
  raidBossMaxHp: number
  createdAt: string
}

// ─── Shop Item ────────────────────────────────────────────────────────────────
export type ShopItemType = 'consumable' | 'material' | 'skin' | 'currency_pack'

export interface ShopItem {
  id: string
  name: string
  description: string
  itemType: ShopItemType
  cost: number
  costCurrency: 'spiritCrystals' | 'voidShards' | 'pactSeals' | 'gold'
  quantity: number
  limitedUntil: string | null
  artUrl: string | null
}

// ─── Achievement ──────────────────────────────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  description: string
  iconUrl: string | null
  isUnlocked: boolean
  unlockedAt: string | null
  progress: number
  progressMax: number
}

// ─── API Response wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}
