// lib/config-loader.ts

import { Card, DynastyId, Recipe, Lv12SynthesisRule, CardType, getQualityByLevel } from './types'
import { WEEKLY_DYNASTY_ORDER, WEEK_DURATION_MS } from './constants'

// ============ 朝代元数据 ============
import dynastiesData from '@/config/dynasties.json'

// ============ 卡牌数据 - 静态导入 ============
import qinhanCards from '@/config/cards/qinhan.json'
import sanguoCards from '@/config/cards/sanguo.json'
import tangCards from '@/config/cards/tang.json'
import songCards from '@/config/cards/song.json'
import mingCards from '@/config/cards/ming.json'
import chunqiuCards from '@/config/cards/chunqiu.json'

const DYNASTY_CARD_FILES: Record<DynastyId, any[]> = {
  qinhan: qinhanCards,
  sanguo: sanguoCards,
  tang: tangCards,
  song: songCards,
  ming: mingCards,
  chunqiu: chunqiuCards,
}

// ============ 配方数据 ============
import recipesData from '@/config/recipes/index.json'

export interface DynastyMeta {
  id: DynastyId
  name: string
  period: string
  order: number
}

export function loadDynasties(): DynastyMeta[] {
  return dynastiesData as DynastyMeta[]
}

export function getDynastyById(id: DynastyId): DynastyMeta | undefined {
  return loadDynasties().find(d => d.id === id)
}

// ============ 卡牌加载 ============
const cardCache: Partial<Record<DynastyId, Card[]>> = {}

function parseCard(raw: any): Card {
  return {
    id: raw.card_id || raw.id,
    name: raw.name,
    level: raw.level,
    quality: getQualityByLevel(raw.level),
    type: raw.type as CardType,
    dynasty: raw.dynasty as DynastyId,
    description: raw.short_desc || raw.description || '',
    story: raw.story || '',
    knowledgePoint: raw.knowledge_point || raw.knowledgePoint || '',
    relatedCards: raw.related_cards || raw.relatedCards || [],
    mergeHint: raw.merge_hint || raw.mergeHint || '',
    image: raw.image,
    tags: raw.tags,
  }
}

export function loadCardsByDynasty(dynasty: DynastyId): Card[] {
  if (!cardCache[dynasty]) {
    const rawData = DYNASTY_CARD_FILES[dynasty] || []
    cardCache[dynasty] = rawData.map(parseCard)
  }
  return cardCache[dynasty]!
}

export function loadAllCards(): Card[] {
  const allCards: Card[] = []
  for (const dynasty of WEEKLY_DYNASTY_ORDER) {
    allCards.push(...loadCardsByDynasty(dynasty))
  }
  return allCards
}

export function getCardById(cardId: string): Card | undefined {
  return loadAllCards().find(c => c.id === cardId)
}

// ============ 配方加载 ============
let recipeCache: Recipe[] | null = null

export function loadAllRecipes(): Recipe[] {
  if (!recipeCache) {
    recipeCache = Array.isArray(recipesData) ? recipesData as Recipe[] : []
  }
  return recipeCache
}

export function getRecipesByDynasty(dynasty: DynastyId): Recipe[] {
  return loadAllRecipes().filter(r => r.dynasty === dynasty)
}

export function getRecipeById(recipeId: string): Recipe | undefined {
  return loadAllRecipes().find(r => r.id === recipeId)
}

// ============ Lv12 合成规则加载 ============
let lv12RulesCache: Lv12SynthesisRule[] | null = null

export function loadLv12Rules(): Lv12SynthesisRule[] {
  if (!lv12RulesCache) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const data = require('@/config/lv12_rules.json')
      lv12RulesCache = Array.isArray(data) ? data : []
    } catch {
      lv12RulesCache = []
    }
  }
  return lv12RulesCache
}

export function getLv12RuleForTarget(lv12CardId: string): Lv12SynthesisRule | undefined {
  return loadLv12Rules().find(r => r.lv12CardId === lv12CardId)
}

// ============ 每周轮换 ============
export function getWeeklyRotation(weekOffset: number = 0): DynastyId {
  const index = weekOffset % WEEKLY_DYNASTY_ORDER.length
  return WEEKLY_DYNASTY_ORDER[index]
}

export function getCurrentWeekNumber(): number {
  return Math.floor(Date.now() / WEEK_DURATION_MS)
}

export function getCurrentWeeklyDynasty(): DynastyId {
  return getWeeklyRotation(getCurrentWeekNumber())
}
