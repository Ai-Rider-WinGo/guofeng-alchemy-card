// lib/synthesis-engine.ts

import { Card, getSuccessRate, getFailureRefund, getFragmentCost } from './types'
import { getCardById, loadCardsByDynasty, getRecipeById, getLv12RuleForTarget } from './config-loader'

// ============ 通用合成 ============

export interface GenericSynthesisResult {
  success: boolean
  resultCardId?: string
  error?: string
  failureRefund?: { type: 'card' | 'fragments'; cardId?: string; amount?: number }
}

export function canGenericSynthesize(card1Id: string, card2Id: string): boolean {
  const card1 = getCardById(card1Id)
  const card2 = getCardById(card2Id)
  if (!card1 || !card2) return false
  if (card1.level !== card2.level) return false
  if (card1.dynasty !== card2.dynasty) return false
  if (card1.level >= 12) return false
  return true
}

export function genericSynthesize(card1Id: string, card2Id: string): GenericSynthesisResult {
  if (!canGenericSynthesize(card1Id, card2Id)) {
    return { success: false, error: '无法合成：等级或朝代不匹配' }
  }

  const card1 = getCardById(card1Id)!
  const targetLevel = card1.level + 1
  const successRate = getSuccessRate(card1.level)

  // 成功率判定
  const roll = Math.random()
  if (roll >= successRate) {
    const refund = getFailureRefund(card1.level)
    if (refund === 'card') {
      return {
        success: false,
        error: '合成失败',
        failureRefund: { type: 'card', cardId: card1Id },
      }
    } else if (refund === 'fragments') {
      return {
        success: false,
        error: '合成失败',
        failureRefund: { type: 'fragments', amount: Math.floor(getFragmentCost(card1.level) / 2) },
      }
    }
    return { success: false, error: '合成失败' }
  }

  // 从同朝代同目标等级中随机选一张
  const dynastyCards = loadCardsByDynasty(card1.dynasty)
  const candidates = dynastyCards.filter(c => c.level === targetLevel)

  if (candidates.length === 0) {
    return { success: false, error: '没有可合成的目标卡牌' }
  }

  const resultCard = candidates[Math.floor(Math.random() * candidates.length)]

  return {
    success: true,
    resultCardId: resultCard.id,
  }
}

// ============ 配方合成 ============

export interface RecipeSynthesisResult {
  success: boolean
  resultCardId?: string
  error?: string
  consumedCards?: string[]
  recipeConsumed?: boolean
}

export function canRecipeSynthesize(
  recipeId: string,
  playerCards: { [cardId: string]: number },
  ownedRecipes: string[]
): boolean {
  if (!ownedRecipes.includes(recipeId)) return false

  const recipe = getRecipeById(recipeId)
  if (!recipe) return false

  for (const requiredId of recipe.requiredCards) {
    if (!playerCards[requiredId] || playerCards[requiredId] < 1) {
      return false
    }
  }

  return true
}

export function recipeSynthesize(
  recipeId: string,
  playerCards: { [cardId: string]: number }
): RecipeSynthesisResult {
  const recipe = getRecipeById(recipeId)
  if (!recipe) {
    return { success: false, error: '配方不存在' }
  }

  for (const requiredId of recipe.requiredCards) {
    if (!playerCards[requiredId] || playerCards[requiredId] < 1) {
      return { success: false, error: `缺少材料: ${requiredId}` }
    }
  }

  return {
    success: true,
    resultCardId: recipe.resultCardId,
    consumedCards: [...recipe.requiredCards],
    recipeConsumed: recipe.isConsumed,
  }
}

// ============ 碎片兑换 ============

export interface FragmentExchangeResult {
  success: boolean
  resultCardId?: string
  error?: string
  fragmentCost?: number
}

export function canFragmentExchange(targetLevel: number, fragmentCount: number): boolean {
  return fragmentCount >= getFragmentCost(targetLevel)
}

export function fragmentExchange(
  targetCardId: string,
  fragmentCount: number
): FragmentExchangeResult {
  const card = getCardById(targetCardId)
  if (!card) {
    return { success: false, error: '目标卡牌不存在' }
  }

  const cost = getFragmentCost(card.level)
  if (fragmentCount < cost) {
    return { success: false, error: '碎片不足' }
  }

  return {
    success: true,
    resultCardId: card.id,
    fragmentCost: cost,
  }
}

// ============ Lv12 合成（唯一路径） ============

export interface Lv12SynthesisResult {
  success: boolean
  resultCardId?: string
  error?: string
  consumedCards?: string[]
}

export function canLv12Synthesize(
  lv12CardId: string,
  playerCards: { [cardId: string]: number }
): boolean {
  const rule = getLv12RuleForTarget(lv12CardId)
  if (!rule) return false

  for (const lv11Id of rule.requiredLv11CardIds) {
    if (!playerCards[lv11Id] || playerCards[lv11Id] < 1) {
      return false
    }
  }

  return true
}

export function lv12Synthesize(
  lv12CardId: string,
  playerCards: { [cardId: string]: number }
): Lv12SynthesisResult {
  const rule = getLv12RuleForTarget(lv12CardId)
  if (!rule) {
    return { success: false, error: 'Lv12 合成规则不存在' }
  }

  for (const lv11Id of rule.requiredLv11CardIds) {
    if (!playerCards[lv11Id] || playerCards[lv11Id] < 1) {
      return { success: false, error: `缺少 ${lv11Id}` }
    }
  }

  return {
    success: true,
    resultCardId: rule.lv12CardId,
    consumedCards: [...rule.requiredLv11CardIds],
  }
}
