// lib/config-loader.ts
// 数据来源优先级：后端 /api/public/bootstrap > 本地静态 JSON（fallback）。
// 第 1 步：从后端拉取卡牌/池/合成规则，缓存到内存；同步导出函数保持不变以兼容上层。

import { Card, DynastyId, Recipe, Lv12SynthesisRule, CardType, getQualityByLevel } from './types'
import { WEEKLY_DYNASTY_ORDER, WEEK_DURATION_MS } from './constants'
import { getBootstrapCached, type BackendCard } from './api/public'

// ============ 朝代元数据（静态，元数据量小且稳定） ============
import dynastiesData from '@/config/dynasties.json'

// ============ 静态 JSON fallback（后端不可用时兜底） ============
import qinhanCards from '@/config/cards/qinhan.json'
import sanguoCards from '@/config/cards/sanguo.json'
import tangCards from '@/config/cards/tang.json'
import songCards from '@/config/cards/song.json'
import mingCards from '@/config/cards/ming.json'
import chunqiuCards from '@/config/cards/chunqiu.json'
import recipesData from '@/config/recipes/index.json'

const STATIC_DYNASTY_CARDS: Record<DynastyId, any[]> = {
  qinhan: qinhanCards,
  sanguo: sanguoCards,
  tang: tangCards,
  song: songCards,
  ming: mingCards,
  chunqiu: chunqiuCards,
}

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
  return loadDynasties().find((d) => d.id === id)
}

// ============ 后端数据缓存层 ============
// 后端 dynasty_tag（下划线）↔ 前端 DynastyId（驼峰）映射
const TAG_TO_DYNASTY: Record<string, DynastyId> = {
  qin_han: 'qinhan',
  three_kingdoms: 'sanguo',
  tang: 'tang',
  song: 'song',
  ming: 'ming',
  spring_autumn_warring_states: 'chunqiu',
}
const DYNASTY_TO_TAG: Record<DynastyId, string> = {
  qinhan: 'qin_han',
  sanguo: 'three_kingdoms',
  tang: 'tang',
  song: 'song',
  ming: 'ming',
  chunqiu: 'spring_autumn_warring_states',
}

// 后端 type → 前端 CardType 归并
const TYPE_MAP: Record<string, CardType> = {
  person: 'person',
  event: 'event',
  place: 'place',
  weapon: 'artifact',
  classic: 'strategy',
  dynasty: 'strategy',
}

let backendCards: Card[] | null = null
let backendCardsByDynasty: Partial<Record<DynastyId, Card[]>> = {}
let backendRecipes: Recipe[] | null = null
let backendReady = false

/** 把后端卡牌转成前端 Card 结构 */
function parseBackendCard(raw: BackendCard): Card {
  const dynasty = (TAG_TO_DYNASTY[raw.dynasty_tag || ''] || 'qinhan') as DynastyId
  return {
    id: raw.card_id,
    name: raw.name,
    level: raw.level,
    quality: getQualityByLevel(raw.level),
    type: TYPE_MAP[raw.type] || 'person',
    dynasty,
    description: raw.short_desc || '',
    story: raw.story || '',
    knowledgePoint: raw.knowledge_point || '',
    relatedCards: raw.related_cards || [],
    mergeHint: '',
    image: raw.image_url || raw.thumbnail_url || undefined,
    tags: raw.tags || undefined,
  }
}

/**
 * 初始化：从后端拉取游戏数据（卡牌/池/合成规则）。
 * 在客户端 GameProvider hydration 时调用一次。失败则静默回退到静态 JSON。
 */
export async function initGameData(): Promise<void> {
  if (backendReady || typeof window === 'undefined') return
  try {
    const data = await getBootstrapCached()
    backendCards = data.cards.map(parseBackendCard)
    backendCardsByDynasty = {}
    for (const c of backendCards) {
      if (!backendCardsByDynasty[c.dynasty]) backendCardsByDynasty[c.dynasty] = []
      backendCardsByDynasty[c.dynasty]!.push(c)
    }
    backendRecipes = []
    backendReady = true
    // eslint-disable-next-line no-console
    console.log(`[config-loader] 已从后端加载 ${backendCards.length} 张卡牌`)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[config-loader] 后端数据加载失败，回退静态 JSON', e)
  }
}

export function isGameDataReady(): boolean {
  return backendReady
}

// ============ 卡牌加载（同步导出，保持接口兼容） ============

const staticCache: Partial<Record<DynastyId, Card[]>> = {}

function parseStaticCard(raw: any): Card {
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
  if (backendCardsByDynasty[dynasty]) return backendCardsByDynasty[dynasty]!
  if (!staticCache[dynasty]) {
    const rawData = STATIC_DYNASTY_CARDS[dynasty] || []
    staticCache[dynasty] = rawData.map(parseStaticCard)
  }
  return staticCache[dynasty]!
}

export function loadAllCards(): Card[] {
  if (backendCards) return backendCards
  const allCards: Card[] = []
  for (const dynasty of WEEKLY_DYNASTY_ORDER) {
    allCards.push(...loadCardsByDynasty(dynasty))
  }
  return allCards
}

export function getCardById(cardId: string): Card | undefined {
  return loadAllCards().find((c) => c.id === cardId)
}

// ============ 配方加载 ============

export function loadAllRecipes(): Recipe[] {
  if (backendRecipes) return backendRecipes
  return Array.isArray(recipesData) ? (recipesData as Recipe[]) : []
}

export function getRecipesByDynasty(dynasty: DynastyId): Recipe[] {
  return loadAllRecipes().filter((r) => r.dynasty === dynasty)
}

export function getRecipeById(recipeId: string): Recipe | undefined {
  return loadAllRecipes().find((r) => r.id === recipeId)
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
  return loadLv12Rules().find((r) => r.lv12CardId === lv12CardId)
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

export { DYNASTY_TO_TAG, TAG_TO_DYNASTY }
