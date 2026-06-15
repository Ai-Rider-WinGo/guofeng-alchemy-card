import { GameState, Card, TaskDef, STORAGE_KEYS, INITIAL_GAME_STATE, DAILY_DRAW_LIMIT, DAILY_AUTO_MERGE_LIMIT, AD_BONUS_AUTO_MERGES, DynastyId } from './types'
import taskDefsData from '@/config/tasks.json'
import signInRewardsData from '@/config/signin_rewards.json'
import mergeRulesData from '@/config/merge_rules.json'
import cardsData from '@/config/cards.json'

// ============ 基础持久化 ============

// 从 localStorage 读取游戏状态
export function loadGameState(): GameState {
  if (typeof window === 'undefined') return INITIAL_GAME_STATE

  const stored = localStorage.getItem(STORAGE_KEYS.gameState)
  if (!stored) return INITIAL_GAME_STATE

  try {
    const state = JSON.parse(stored) as GameState
    // 合并不在旧存档中的新字段
    return { ...INITIAL_GAME_STATE, ...state }
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
  // 同时重置每日任务进度
  const newTaskProgress = { ...state.taskProgress }
  const dailyTasks = (taskDefsData as { daily: TaskDef[] }).daily
  for (const task of dailyTasks) {
    newTaskProgress[task.id] = { current: 0, claimed: false }
  }

  return {
    ...state,
    dailyDrawCount: 0,
    dailyAutoMergeCount: 0,
    lastDailyReset: Date.now(),
    lastAutoMergeReset: Date.now(),
    taskProgress: newTaskProgress,
  }
}

// ============ 抽卡相关 ============

// 检查剩余抽卡次数
export function getRemainingDraws(state: GameState): number {
  return Math.max(0, DAILY_DRAW_LIMIT - state.dailyDrawCount)
}

// ============ 库存管理 ============

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
    totalMerges: (newState.totalMerges || 0) + 1,
  }

  // 更新任务进度
  newState = updateTaskProgress(newState, 'daily_merge', 1)
  newState = updateTaskProgress(newState, 'ach_first_merge', 1)
  newState = updateTaskProgress(newState, 'ach_merge_5', 1)

  return newState
}

// ============ 碎片系统 ============

// 添加碎片
export function addFragments(state: GameState, shardKey: string, amount: number): GameState {
  const newFragments = { ...state.fragments }
  newFragments[shardKey] = (newFragments[shardKey] || 0) + amount
  return { ...state, fragments: newFragments }
}

// 消耗碎片
export function consumeFragments(state: GameState, shardKey: string, amount: number): GameState {
  const newFragments = { ...state.fragments }
  const current = newFragments[shardKey] || 0
  if (current <= amount) {
    delete newFragments[shardKey]
  } else {
    newFragments[shardKey] = current - amount
  }
  return { ...state, fragments: newFragments }
}

// 获取碎片数量
export function getFragmentCount(state: GameState, shardKey: string): number {
  return state.fragments?.[shardKey] || 0
}

// 重复卡转碎片（规则：L1→5张同朝代碎片，L2→10张，L3+→该卡ID碎片）
export function convertDuplicateToFragment(state: GameState, cardId: string, cardLevel: number, dynasty: string): GameState {
  const shardKey = cardLevel >= 3 ? cardId : dynasty
  const amount = cardLevel === 1 ? 5 : cardLevel === 2 ? 10 : cardLevel === 3 ? 3 : cardLevel === 4 ? 2 : 1
  return addFragments(state, shardKey, amount)
}

// ============ 任务系统 ============

// 更新任务进度
export function updateTaskProgress(state: GameState, taskId: string, delta: number = 1): GameState {
  const newTaskProgress = { ...state.taskProgress }
  const existing = newTaskProgress[taskId]
  if (existing) {
    // 已领取的不再更新
    if (existing.claimed) return state
    newTaskProgress[taskId] = {
      ...existing,
      current: Math.min(existing.current + delta, 999),
    }
  } else {
    newTaskProgress[taskId] = { current: delta, claimed: false }
  }
  return { ...state, taskProgress: newTaskProgress }
}

// 领取任务奖励
export function claimTaskReward(state: GameState, taskId: string, reward: { type: string; amount: number }): GameState {
  const newTaskProgress = { ...state.taskProgress }
  const existing = newTaskProgress[taskId]
  if (!existing || existing.claimed) return state

  newTaskProgress[taskId] = { ...existing, claimed: true }
  let newState: GameState = { ...state, taskProgress: newTaskProgress }

  // 统一发放碎片
  newState = addFragments(newState, 'general', reward.amount)

  return newState
}

// 判断任务是否完成
export function isTaskComplete(state: GameState, taskId: string, target: number): boolean {
  const progress = state.taskProgress?.[taskId]
  return progress ? progress.current >= target : false
}

// 判断任务是否已领取
export function isTaskClaimed(state: GameState, taskId: string): boolean {
  return state.taskProgress?.[taskId]?.claimed || false
}

// ============ 签到系统 ============

// 执行签到
export function doSignIn(state: GameState): { newState: GameState; reward: { type: string; amount: number; label: string } | null } {
  const today = new Date().toISOString().slice(0, 10)
  const lastDate = state.signIn?.lastSignInDate || ''

  if (lastDate === today) {
    return { newState: state, reward: null } // 今日已签到
  }

  // 检查是否连续
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const isConsecutive = lastDate === yesterday

  const newStreak = isConsecutive ? (state.signIn?.streak || 0) + 1 : 1
  const cycleDay = ((newStreak - 1) % 7) + 1

  // 获取奖励
  const rewards = (signInRewardsData as { cycle: number; rewards: Array<{ day: number; type: string; amount: number; label: string }> }).rewards
  const reward = rewards.find((r) => r.day === cycleDay) || null

  let newState: GameState = {
    ...state,
    signIn: {
      streak: newStreak,
      lastSignInDate: today,
      currentCycleDay: cycleDay,
    },
  }

  // 发放奖励 — 统一碎片
  if (reward) {
    newState = addFragments(newState, 'general', reward.amount)
  }

  return { newState, reward }
}

// ============ 周期收集奖励 ============

// 更新收集进度
export function updateWeeklyCollectionProgress(state: GameState, poolId: string, unlockedCount: number): GameState {
  const newWeeklyRewards = { ...state.weeklyRewards }
  const existing = newWeeklyRewards[poolId]
  newWeeklyRewards[poolId] = {
    collectedCount: unlockedCount,
    claimedTiers: existing?.claimedTiers || [],
  }
  return { ...state, weeklyRewards: newWeeklyRewards }
}

// 领取收集奖励档位
export function claimWeeklyReward(state: GameState, poolId: string, tierIndex: number, reward: { type: string; amount?: number; item?: string; label: string }): GameState {
  const newWeeklyRewards = { ...state.weeklyRewards }
  const existing = newWeeklyRewards[poolId]
  if (!existing || existing.claimedTiers.includes(tierIndex)) return state

  newWeeklyRewards[poolId] = {
    ...existing,
    claimedTiers: [...existing.claimedTiers, tierIndex],
  }
  let newState: GameState = { ...state, weeklyRewards: newWeeklyRewards }

  // 统一发放碎片（exclusive 类型不做碎片发放）
  if (reward.amount) {
    newState = addFragments(newState, 'general', reward.amount)
  }

  return newState
}

// ============ 图鉴与查询 ============

// 获取图鉴完成度
export function getCollectionProgress(state: GameState, allCards: Card[]): { unlocked: number; total: number } {
  const total = allCards.length
  const unlocked = state.unlockedCards.length

  return { unlocked, total }
}

// 获取按朝代的收集进度
export function getCollectionProgressByDynasty(state: GameState, allCards: Card[]): { [dynasty: string]: { unlocked: number; total: number } } {
  const result: { [dynasty: string]: { unlocked: number; total: number } } = {}
  for (const card of allCards) {
    if (!result[card.dynasty]) {
      result[card.dynasty] = { unlocked: 0, total: 0 }
    }
    result[card.dynasty].total++
    if (state.unlockedCards.includes(card.id)) {
      result[card.dynasty].unlocked++
    }
  }
  return result
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
    if (rarity && card.quality !== rarity) return false
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

// 获取可升星的卡牌列表
export function getStarUpCandidates(state: GameState): Array<{ cardId: string; count: number; stars: number }> {
  const candidates: Array<{ cardId: string; count: number; stars: number }> = []
  for (const [cardId, count] of Object.entries(state.playerCards)) {
    const stars = calculateStars(count)
    if (stars > 0) {
      candidates.push({ cardId, count, stars })
    }
  }
  return candidates
}

// ============ 自动合成系统 ============

// 获取剩余自动合成次数
export function getRemainingAutoMerges(state: GameState): number {
  return Math.max(0, DAILY_AUTO_MERGE_LIMIT - (state.dailyAutoMergeCount || 0))
}

// 检查是否可以自动合成（有没有有效配对 + 有没有剩余次数）
export function canDoAutoMerge(state: GameState, allCardIds: string[]): boolean {
  if (getRemainingAutoMerges(state) <= 0) return false
  return findAutoMergePair(state, allCardIds) !== null
}

// 查找最优自动合成配对
function findAutoMergePair(state: GameState, allCardIds: string[]): { card1Id: string; card2Id: string; resultCardId: string } | null {
  // 动态导入 cardUtils 的 canMerge（避免循环依赖，内联逻辑）
  const ownedCardIds = Object.keys(state.playerCards).filter((id) => (state.playerCards[id] || 0) > 0)
  if (ownedCardIds.length < 2) return null

  // 导入合成规则来检查
  let bestPair: { card1Id: string; card2Id: string; resultCardId: string; score: number } | null = null

  for (let i = 0; i < ownedCardIds.length; i++) {
    for (let j = i + 1; j < ownedCardIds.length; j++) {
      const card1Id = ownedCardIds[i]
      const card2Id = ownedCardIds[j]

      // 内联合成检查逻辑（避免循环导入 canMerge）
      const rule = checkMergeRule(card1Id, card2Id)
      if (!rule) continue

      // 评分：等级越高越好（最高5分），稀有度越高越好
      const resultCard = getCardFromConfig(rule.to)
      if (!resultCard) continue

      const levelScore = (resultCard.level || 1) * 2
      const rarityScore = { common: 0, fine: 1, rare: 2, epic: 3, divine: 4, treasure: 5 }[resultCard.quality] || 0
      const score = levelScore + rarityScore

      if (!bestPair || score > bestPair.score) {
        bestPair = { card1Id, card2Id, resultCardId: rule.to, score }
      }
    }
  }

  return bestPair ? { card1Id: bestPair.card1Id, card2Id: bestPair.card2Id, resultCardId: bestPair.resultCardId } : null
}

// 内联合成规则检查
function checkMergeRule(card1Id: string, card2Id: string): { to: string } | null {
  for (const rule of mergeRulesData) {
    if ((rule.input_a === card1Id && rule.input_b === card2Id) ||
        (rule.input_a === card2Id && rule.input_b === card1Id)) {
      return { to: rule.output }
    }
  }
  return null
}

// 从配置获取卡牌信息
function getCardFromConfig(cardId: string): { level: number; quality: string } | null {
  const card = (cardsData as any[]).find((c: any) => c.card_id === cardId)
  return card ? { level: card.level, quality: card.quality } : null
}

// 执行自动合成
export function performAutoMerge(state: GameState): {
  newState: GameState
  success: boolean
  card1Name?: string
  card2Name?: string
  resultName?: string
} {
  if (getRemainingAutoMerges(state) <= 0) {
    return { newState: state, success: false }
  }

  const playerCardIds = Object.keys(state.playerCards).filter((id) => (state.playerCards[id] || 0) > 0)
  const pair = findAutoMergePair(state, playerCardIds)

  if (!pair) {
    return { newState: state, success: false }
  }

  // 执行合成（复用 executeMerge 逻辑，但这里手动做避免内部检查干扰）
  let newState = removeCardFromInventory(state, pair.card1Id, 1)
  newState = removeCardFromInventory(newState, pair.card2Id, 1)
  newState = addCardToInventory(newState, pair.resultCardId)

  // 记录合成历史 + 更新计数
  newState = {
    ...newState,
    mergeHistory: [
      ...newState.mergeHistory,
      { from: [pair.card1Id, pair.card2Id] as [string, string], to: pair.resultCardId, timestamp: Date.now() },
    ],
    totalMerges: (newState.totalMerges || 0) + 1,
    dailyAutoMergeCount: (newState.dailyAutoMergeCount || 0) + 1,
  }

  // 更新任务进度
  newState = updateTaskProgress(newState, 'daily_merge', 1)
  newState = updateTaskProgress(newState, 'ach_first_merge', 1)
  newState = updateTaskProgress(newState, 'ach_merge_5', 1)

  // 获取卡牌名称
  const c1 = (cardsData as any[]).find((c: any) => c.card_id === pair.card1Id)
  const c2 = (cardsData as any[]).find((c: any) => c.card_id === pair.card2Id)
  const cr = (cardsData as any[]).find((c: any) => c.card_id === pair.resultCardId)

  return {
    newState,
    success: true,
    card1Name: c1?.name,
    card2Name: c2?.name,
    resultName: cr?.name,
  }
}

// 广告激励：增加自动合成次数（预留接口）
export function addAdAutoMerge(state: GameState): GameState {
  // 广告次数叠加到当日，不限上限
  return {
    ...state,
    dailyAutoMergeCount: Math.max(0, (state.dailyAutoMergeCount || 0) - AD_BONUS_AUTO_MERGES),
  }
}

// ============ 配方库存 ============

export function addRecipeToInventory(state: GameState, recipeId: string): GameState {
  if (state.ownedRecipes.includes(recipeId)) return state
  return {
    ...state,
    ownedRecipes: [...state.ownedRecipes, recipeId],
  }
}

export function useRecipe(state: GameState, recipeId: string): GameState {
  return {
    ...state,
    ownedRecipes: state.ownedRecipes.filter(id => id !== recipeId),
    usedRecipes: [...state.usedRecipes, recipeId],
  }
}

// ============ 每周轮换 ============

import { WEEKLY_DYNASTY_ORDER, WEEK_DURATION_MS } from './constants'

export function shouldRotateWeek(state: GameState): boolean {
  return Date.now() - state.lastWeekRotation >= WEEK_DURATION_MS
}

export function rotateWeek(state: GameState): GameState {
  const currentIndex = WEEKLY_DYNASTY_ORDER.indexOf(state.currentWeeklyDynasty)
  const nextIndex = (currentIndex + 1) % WEEKLY_DYNASTY_ORDER.length
  return {
    ...state,
    currentWeeklyDynasty: WEEKLY_DYNASTY_ORDER[nextIndex],
    lastWeekRotation: Date.now(),
  }
}

export function setWeeklyDynasty(state: GameState, dynasty: DynastyId): GameState {
  return {
    ...state,
    currentWeeklyDynasty: dynasty,
    lastWeekRotation: Date.now(),
  }
}
