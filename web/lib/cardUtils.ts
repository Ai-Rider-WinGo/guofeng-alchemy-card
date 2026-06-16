// lib/cardUtils.ts — 适配新类型系统

import { Card, DynastyId, CardQuality, CardType } from './types'
import { loadAllCards, loadCardsByDynasty, getCardById as configGetCardById, loadDynasties } from './config-loader'
import { canGenericSynthesize, genericSynthesize } from './synthesis-engine'

// ============ 卡牌加载（委托给 config-loader） ============

export function loadCards(): Card[] {
  return loadAllCards()
}

export { loadCardsByDynasty }

export function getCardById(cardId: string): Card | undefined {
  return configGetCardById(cardId)
}

// ============ 朝代/品质/类型查询 ============

export function getAllDynasties(): string[] {
  return loadDynasties().map(d => d.id)
}

export function getAllQualities(): CardQuality[] {
  return ['common', 'fine', 'rare', 'epic', 'divine', 'treasure']
}

export function getAllTypes(): CardType[] {
  return ['person', 'event', 'place', 'artifact', 'strategy']
}

// ============ 旧版兼容：canMerge → 新合成引擎 ============

export function canMerge(card1Id: string, card2Id: string): { to: string; mergeDesc: string } | null {
  if (!canGenericSynthesize(card1Id, card2Id)) return null

  const result = genericSynthesize(card1Id, card2Id)
  if (!result.success || !result.resultCardId) return null

  const targetCard = getCardById(result.resultCardId)
  return {
    to: result.resultCardId,
    mergeDesc: targetCard ? `合成 ${targetCard.name}` : '未知合成结果',
  }
}

// ============ 抽卡池（兼容旧版接口） ============

export interface DrawPool {
  pool_id: string
  name: string
  levels: number[]
  rarity_weights: Record<string, number>
  active_card_ids: string[]
}

export function loadDrawPools(): DrawPool[] {
  // 返回兼容格式的抽卡池
  return [
    {
      pool_id: 'permanent_basic',
      name: '基础池',
      levels: [1, 2, 3],
      rarity_weights: {
        common: 0.60,
        fine: 0.25,
        rare: 0.10,
        epic: 0.04,
        divine: 0.01,
        treasure: 0,
      },
      active_card_ids: loadCardsByDynasty('qinhan')
        .filter(c => c.level <= 3)
        .map(c => c.id),
    },
  ]
}

export function drawFromPool(poolId: string): string | null {
  const pools = loadDrawPools()
  const pool = pools.find(p => p.pool_id === poolId)
  if (!pool || pool.active_card_ids.length === 0) return null

  const totalWeight = Object.values(pool.rarity_weights).reduce((a, b) => a + b, 0)
  let randomValue = Math.random() * totalWeight
  let selectedRarity: string | null = null

  for (const [rarity, weight] of Object.entries(pool.rarity_weights)) {
    randomValue -= weight
    if (randomValue <= 0) {
      selectedRarity = rarity
      break
    }
  }

  if (!selectedRarity) selectedRarity = Object.keys(pool.rarity_weights)[0]

  const cards = loadCards()
  const candidateCards = pool.active_card_ids
    .map(id => cards.find(c => c.id === id))
    .filter((c): c is Card =>
      c !== undefined &&
      c.quality === selectedRarity &&
      pool.levels.includes(c.level)
    )

  if (candidateCards.length === 0) {
    const allCandidates = pool.active_card_ids
      .map(id => cards.find(c => c.id === id))
      .filter((c): c is Card => c !== undefined && pool.levels.includes(c.level))

    if (allCandidates.length === 0) return null
    return allCandidates[Math.floor(Math.random() * allCandidates.length)].id
  }

  return candidateCards[Math.floor(Math.random() * candidateCards.length)].id
}

export function draw10FromPool(poolId: string): string[] {
  const results: string[] = []
  for (let i = 0; i < 10; i++) {
    const cardId = drawFromPool(poolId)
    if (cardId) results.push(cardId)
  }
  return results
}

// ============ 查询辅助 ============

export function getCardsByDynasty(dynasty: string): Card[] {
  return loadAllCards().filter(c => c.dynasty === dynasty)
}

export function getCollectionProgress(state: { unlockedCards: string[] }, allCards: Card[]): { unlocked: number; total: number } {
  return {
    total: allCards.length,
    unlocked: state.unlockedCards.length,
  }
}

export function getCollectionProgressByDynasty(
  state: { unlockedCards: string[] },
  allCards: Card[]
): { [dynasty: string]: { unlocked: number; total: number } } {
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

export function filterCards(
  cards: Card[],
  filters: { dynasty?: string; level?: number; type?: string; rarity?: string }
): Card[] {
  return cards.filter(card => {
    if (filters.dynasty && card.dynasty !== filters.dynasty) return false
    if (filters.level && card.level !== filters.level) return false
    if (filters.type && card.type !== filters.type) return false
    if (filters.rarity && card.quality !== filters.rarity) return false
    return true
  })
}

export function searchCards(cards: Card[], query: string): Card[] {
  const lowerQuery = query.toLowerCase()
  return cards.filter(card =>
    card.name.toLowerCase().includes(lowerQuery) ||
    card.description.toLowerCase().includes(lowerQuery)
  )
}
