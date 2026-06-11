import { GameState, Card, MergeRule, STORAGE_KEYS, INITIAL_GAME_STATE, DAILY_DRAW_LIMIT } from './types'

// 从 localStorage 读取游戏状态
export function loadGameState(): GameState {
  if (typeof window === 'undefined') return INITIAL_GAME_STATE

  const stored = localStorage.getItem(STORAGE_KEYS.gameState)
  if (!stored) return INITIAL_GAME_STATE

  try {
    const state = JSON.parse(stored) as GameState
    return state
  } catch {
    return INITIAL_GAME_STATE
  }
}

// 保存游戏状态到 localStorage
export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEYS.gameState, JSON.stringify(state))
  } catch {
    console.error('[v0] Failed to save game state')
  }
}

// 检查是否需要重置每日计数
export function shouldResetDailyCount(state: GameState): boolean {
  const lastReset = new Date(state.lastDailyReset)
  const today = new Date()

  return (
    lastReset.getFullYear() !== today.getFullYear() ||
    lastReset.getMonth() !== today.getMonth() ||
    lastReset.getDate() !== today.getDate()
  )
}

// 重置每日计数
export function resetDailyCount(state: GameState): GameState {
  return {
    ...state,
    dailyDrawCount: 0,
    lastDailyReset: Date.now(),
  }
}

// 检查剩余抽卡次数
export function getRemainingDraws(state: GameState): number {
  return Math.max(0, DAILY_DRAW_LIMIT - state.dailyDrawCount)
}

// 将卡片添加到玩家库存
export function addCardToInventory(state: GameState, cardId: string): GameState {
  const newPlayerCards = { ...state.playerCards }
  newPlayerCards[cardId] = (newPlayerCards[cardId] || 0) + 1

  const newUnlockedCards = state.unlockedCards.includes(cardId)
    ? state.unlockedCards
    : [...state.unlockedCards, cardId]

  return {
    ...state,
    playerCards: newPlayerCards,
    unlockedCards: newUnlockedCards,
  }
}

// 从玩家库存移除卡片
export function removeCardFromInventory(state: GameState, cardId: string, count: number = 1): GameState {
  const newPlayerCards = { ...state.playerCards }
  const current = newPlayerCards[cardId] || 0

  if (current <= count) {
    delete newPlayerCards[cardId]
  } else {
    newPlayerCards[cardId] = current - count
  }

  return {
    ...state,
    playerCards: newPlayerCards,
  }
}

// 执行合成操作
export function executeMerge(
  state: GameState,
  card1Id: string,
  card2Id: string,
  resultCardId: string
): GameState {
  // 检查玩家是否拥有两张卡
  if ((state.playerCards[card1Id] || 0) < 1 || (state.playerCards[card2Id] || 0) < 1) {
    return state
  }

  // 移除输入卡
  let newState = removeCardFromInventory(state, card1Id, 1)
  newState = removeCardFromInventory(newState, card2Id, 1)

  // 添加结果卡
  newState = addCardToInventory(newState, resultCardId)

  // 记录合成历史
  newState = {
    ...newState,
    mergeHistory: [
      ...newState.mergeHistory,
      {
        from: [card1Id, card2Id],
        to: resultCardId,
        timestamp: Date.now(),
      },
    ],
  }

  return newState
}

// 获取图鉴完成度
export function getCollectionProgress(state: GameState, allCards: Card[]): { unlocked: number; total: number } {
  const total = allCards.length
  const unlocked = state.unlockedCards.length

  return { unlocked, total }
}

// 过滤卡牌
export function filterCards(
  cards: Card[],
  { dynasty, level, type, rarity }: { dynasty?: string; level?: number; type?: string; rarity?: string }
): Card[] {
  return cards.filter((card) => {
    if (dynasty && card.dynasty !== dynasty) return false
    if (level && card.level !== level) return false
    if (type && card.type !== type) return false
    if (rarity && card.rarity !== rarity) return false
    return true
  })
}

// 搜索卡牌
export function searchCards(cards: Card[], query: string): Card[] {
  const lowerQuery = query.toLowerCase()
  return cards.filter((card) => 
    card.name.toLowerCase().includes(lowerQuery) ||
    card.description.toLowerCase().includes(lowerQuery)
  )
}

// 获取玩家拥有的卡牌数
export function getPlayerCardCount(state: GameState, cardId: string): number {
  return state.playerCards[cardId] || 0
}

// 计算升星数
export function calculateStars(count: number, requiredPerStar: number = 3): number {
  return Math.floor(count / requiredPerStar)
}
