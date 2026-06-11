import cardsData from '@/config/cards.json'
import mergeRulesData from '@/config/merge_rules.json'
import drawPoolsData from '@/config/draw_pools.json'
import { Card, MergeRule } from './types'

export interface DrawPool {
  pool_id: string
  name: string
  levels: number[]
  rarity_weights: Record<string, number>
  active_card_ids: string[]
}

// 加载卡牌数据
export function loadCards(): Card[] {
  return cardsData.map((card: any) => ({
    id: card.card_id,
    name: card.name,
    level: card.level,
    type: card.type,
    dynasty: card.dynasty,
    rarity: card.rarity,
    description: card.short_desc,
    story: card.story,
    knowledgePoint: card.knowledge_point,
    relatedCards: card.related_cards,
    mergeHint: card.merge_hint,
  }))
}

// 加载合成规则
export function loadMergeRules(): MergeRule[] {
  return mergeRulesData.map((rule: any) => ({
    from: [rule.input_a, rule.input_b],
    to: rule.output,
    mergeDesc: rule.merge_desc,
    requiresOrder: false,
  }))
}

// 加载抽卡池
export function loadDrawPools(): DrawPool[] {
  return drawPoolsData
}

// 获取卡牌 by ID
export function getCardById(cardId: string): Card | undefined {
  const cards = loadCards()
  return cards.find((c) => c.id === cardId)
}

// 从抽卡池随机抽卡
export function drawFromPool(poolId: string): string | null {
  const pools = loadDrawPools()
  const pool = pools.find((p) => p.pool_id === poolId)

  if (!pool || pool.active_card_ids.length === 0) return null

  // 按稀有度权重随机选择稀有度
  const rarityWeights = pool.rarity_weights
  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0)
  let randomValue = Math.random() * totalWeight
  let selectedRarity: string | null = null

  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    randomValue -= weight
    if (randomValue <= 0) {
      selectedRarity = rarity
      break
    }
  }

  if (!selectedRarity) selectedRarity = Object.keys(rarityWeights)[0]

  // 从选定稀有度的卡牌中随机选择
  const cards = loadCards()
  const candidateCards = pool.active_card_ids
    .map((id) => cards.find((c) => c.id === id))
    .filter(
      (c): c is Card =>
        c !== undefined &&
        c.rarity === selectedRarity &&
        pool.levels.includes(c.level)
    )

  if (candidateCards.length === 0) {
    // 降级到任意可用卡牌
    const allCandidates = pool.active_card_ids
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is Card => c !== undefined && pool.levels.includes(c.level))

    if (allCandidates.length === 0) return null
    return allCandidates[Math.floor(Math.random() * allCandidates.length)].id
  }

  return candidateCards[Math.floor(Math.random() * candidateCards.length)].id
}

// 检查是否可以合成两张卡
export function canMerge(card1Id: string, card2Id: string): MergeRule | null {
  const rules = loadMergeRules()

  // 检查顺序 1->2 或 2->1
  const rule =
    rules.find(
      (r) => (r.from[0] === card1Id && r.from[1] === card2Id) || (r.from[0] === card2Id && r.from[1] === card1Id)
    ) || null

  return rule
}

// 十连抽
export function draw10FromPool(poolId: string): string[] {
  const results: string[] = []
  for (let i = 0; i < 10; i++) {
    const cardId = drawFromPool(poolId)
    if (cardId) {
      results.push(cardId)
    }
  }
  return results
}

// 获取指定朝代的所有卡牌
export function getCardsByDynasty(dynasty: string): Card[] {
  const cards = loadCards()
  return cards.filter((c) => c.dynasty === dynasty)
}

// 获取所有朝代
export function getAllDynasties(): string[] {
  const cards = loadCards()
  const dynasties = new Set(cards.map((c) => c.dynasty))
  return Array.from(dynasties).sort()
}

// 获取所有稀有度
export function getAllRarities(): string[] {
  const cards = loadCards()
  const rarities = new Set(cards.map((c) => c.rarity))
  return Array.from(rarities)
}

// 获取所有类型
export function getAllTypes(): string[] {
  const cards = loadCards()
  const types = new Set(cards.map((c) => c.type))
  return Array.from(types)
}
