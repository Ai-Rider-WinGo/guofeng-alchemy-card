// lib/types.ts — 完整重构

// ============ 品质体系 ============
export type CardQuality = 'common' | 'fine' | 'rare' | 'epic' | 'divine' | 'treasure'

export const CARD_QUALITY: Record<CardQuality, { name: string; levelRange: [number, number] }> = {
  common:   { name: '凡品', levelRange: [1, 2] },
  fine:     { name: '精良', levelRange: [3, 5] },
  rare:     { name: '稀有', levelRange: [6, 7] },
  epic:     { name: '极品', levelRange: [8, 9] },
  divine:   { name: '神品', levelRange: [10, 11] },
  treasure: { name: '至宝', levelRange: [12, 12] },
}

export function getQualityByLevel(level: number): CardQuality {
  for (const [quality, { levelRange }] of Object.entries(CARD_QUALITY)) {
    if (level >= levelRange[0] && level <= levelRange[1]) return quality as CardQuality
  }
  throw new Error(`Invalid level: ${level}`)
}

export function isValidLevel(level: number): level is 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 {
  return Number.isInteger(level) && level >= 1 && level <= 12
}

// ============ 朝代体系 ============
export const DYNASTY_IDS = ['qinhan', 'sanguo', 'tang', 'song', 'ming', 'chunqiu'] as const
export type DynastyId = (typeof DYNASTY_IDS)[number]

export const DYNASTY_META: Record<DynastyId, { name: string; period: string; order: number }> = {
  qinhan:  { name: '秦汉', period: '前221-220', order: 1 },
  sanguo:  { name: '三国', period: '220-280', order: 2 },
  tang:    { name: '唐', period: '618-907', order: 3 },
  song:    { name: '宋', period: '960-1279', order: 4 },
  ming:    { name: '明', period: '1368-1644', order: 5 },
  chunqiu: { name: '春秋战国', period: '前770-前221', order: 6 },
}

// ============ 卡牌类型 ============
export type CardType = 'person' | 'event' | 'place' | 'artifact' | 'strategy'

export interface Card {
  id: string
  name: string
  level: number
  quality: CardQuality
  type: CardType
  dynasty: DynastyId
  description: string
  story: string
  knowledgePoint: string
  relatedCards: string[]
  mergeHint: string
  image?: string
  tags?: string[]
}

// ============ 配方类型 ============
export type RecipeRarity = 'rare' | 'epic' | 'legendary'

export interface Recipe {
  id: string
  name: string
  rarity: RecipeRarity
  dynasty: DynastyId
  requiredCards: string[]
  resultCardId: string
  description: string
  isConsumed: boolean
}

// ============ Lv12 合成定义 ============
export interface Lv12SynthesisRule {
  lv12CardId: string
  requiredLv11CardIds: [string, string, string, string, string, string]
  description: string
}

// ============ 抽卡池 ============
export interface DrawPool {
  poolId: string
  name: string
  dynasty: DynastyId
  levelWeights: Record<number, number>
  qualityWeights: Record<CardQuality, number>
  activeCardIds: string[]
  isWeeklyFeatured: boolean
}

// ============ 碎片成本表 ============
export const FRAGMENT_COST: Record<number, number> = {
  1: 5, 2: 10, 3: 15, 4: 30, 5: 50,
  6: 80, 7: 120, 8: 180, 9: 250, 10: 350,
  11: 500, 12: 800,
}

export function getFragmentCost(level: number): number {
  return FRAGMENT_COST[level] ?? 800
}

// ============ 成功率表 ============
export function getSuccessRate(level: number): number {
  if (level <= 5) return 1.0
  if (level <= 8) return 0.8
  if (level <= 11) return 0.6
  return 0
}

export function getFailureRefund(level: number): 'card' | 'fragments' | 'none' {
  if (level <= 5) return 'none'
  if (level <= 8) return 'card'
  return 'fragments'
}

// ============ Lv12 校验 ============
export function isLv12SynthesisEligible(cardIds: string[]): boolean {
  return cardIds.length === 6
}

// ============ 游戏状态（兼容旧字段） ============
export interface TaskProgress {
  current: number
  claimed: boolean
}

export interface TaskDef {
  id: string
  title: string
  description: string
  target: number
  reward: { type: string; amount: number; label: string }
}

export interface SignInReward {
  day: number
  type: string
  amount: number
  label: string
}

export interface CollectionRewardTier {
  count: number
  reward: { type: string; amount?: number; item?: string; label: string }
}

export interface GameState {
  playerCards: { [cardId: string]: number }
  dailyDrawCount: number
  unlockedCards: string[]
  mergeHistory: Array<{
    from: string[]
    to: string
    timestamp: number
  }>
  lastDailyReset: number
  ultimateCards: string[]
  fragments: { [shardKey: string]: number }
  taskProgress: { [taskId: string]: TaskProgress }
  signIn: {
    streak: number
    lastSignInDate: string
    currentCycleDay: number
  }
  weeklyRewards: {
    [poolId: string]: {
      collectedCount: number
      claimedTiers: number[]
    }
  }
  totalMerges: number
  dailyAutoMergeCount: number
  lastAutoMergeReset: number
  // 新增字段
  ownedRecipes: string[]
  usedRecipes: string[]
  currentWeeklyDynasty: DynastyId
  lastWeekRotation: number
}

export const INITIAL_GAME_STATE: GameState = {
  playerCards: {},
  dailyDrawCount: 0,
  unlockedCards: [],
  mergeHistory: [],
  lastDailyReset: Date.now(),
  ultimateCards: [],
  fragments: {},
  taskProgress: {},
  signIn: {
    streak: 0,
    lastSignInDate: '',
    currentCycleDay: 1,
  },
  weeklyRewards: {},
  totalMerges: 0,
  dailyAutoMergeCount: 0,
  lastAutoMergeReset: Date.now(),
  ownedRecipes: [],
  usedRecipes: [],
  currentWeeklyDynasty: 'qinhan',
  lastWeekRotation: Date.now(),
}

export const DAILY_DRAW_LIMIT = 20
export const DUPLICATION_FOR_STAR = 3
export const DAILY_AUTO_MERGE_LIMIT = 1
export const AD_BONUS_AUTO_MERGES = 2

export const STORAGE_KEYS = {
  gameState: 'alchemy-card-game-state',
  lastPlayDate: 'alchemy-card-last-play-date',
} as const
