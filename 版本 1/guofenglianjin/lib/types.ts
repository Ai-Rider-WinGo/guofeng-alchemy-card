// 卡牌基础类型
export interface Card {
  id: string
  name: string
  nameEn?: string
  level: 1 | 2 | 3 | 4 | 5
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  type: 'person' | 'event' | 'strategy'
  dynasty: string
  description: string
  story: string
  knowledgePoint: string
  relatedCards: string[]
  mergeHint: string
}

// 合成规则
export interface MergeRule {
  from: [string, string]
  to: string
  mergeDesc: string
  requiresOrder?: boolean
}

// 玩家游戏状态
export interface GameState {
  playerCards: { [cardId: string]: number }
  dailyDrawCount: number
  unlockedCards: string[]
  mergeHistory: Array<{
    from: [string, string]
    to: string
    timestamp: number
  }>
  lastDailyReset: number
  ultimateCards: string[]
}

// 初始游戏状态
export const INITIAL_GAME_STATE: GameState = {
  playerCards: {},
  dailyDrawCount: 0,
  unlockedCards: [],
  mergeHistory: [],
  lastDailyReset: Date.now(),
  ultimateCards: [],
}

// 每日抽卡限制
export const DAILY_DRAW_LIMIT = 20

// 升星所需重复数
export const DUPLICATION_FOR_STAR = 3

// 本地存储键
export const STORAGE_KEYS = {
  gameState: 'alchemy-card-game-state',
  lastPlayDate: 'alchemy-card-last-play-date',
} as const
