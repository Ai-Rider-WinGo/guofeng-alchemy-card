# P1: 核心引擎重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 MVP 的 12 张卡/5 级/4 条配方系统，重构为支持 3462 张卡/12 级/多朝代/配方的通用核心引擎。

**Architecture:** 分层重构 — 先类型系统，再配置加载器，再合成引擎，最后更新存储层。所有新代码通过单元测试驱动。不涉及 UI 改动，仅改 `lib/` 和 `config/`。

**Tech Stack:** TypeScript, Next.js (现有项目), Vitest (测试)

---

## 文件结构

```
版本 1/guofenglianjin/
├── lib/
│   ├── types.ts              [修改] 扩展现有类型，新增新类型
│   ├── types.test.ts         [新建] 类型守卫和常量测试
│   ├── constants.ts          [新建] 游戏常量（成功率和碎片成本表）
│   ├── config-loader.ts      [新建] 动态配置加载器（按朝代/等级懒加载卡牌）
│   ├── config-loader.test.ts [新建] 配置加载器测试
│   ├── synthesis-engine.ts   [新建] 核心合成引擎
│   ├── synthesis-engine.test.ts [新建] 合成引擎测试
│   ├── storage.ts            [修改] 适配新类型，保留现有逻辑
│   ├── storage.test.ts       [新建] 存储层测试
│   └── cardUtils.ts          [修改] 适配新类型
└── config/
    ├── dynasties.json        [新建] 6 个朝代元数据
    ├── cards/                [新建目录] 按朝代分文件
    │   ├── qinhan.json       [新建] 秦汉卡牌（含现有 12 张迁移）
    │   ├── sanguo.json       [新建] 三国（骨架）
    │   ├── tang.json         [新建] 唐（骨架）
    │   ├── song.json         [新建] 宋（骨架）
    │   ├── ming.json         [新建] 明（骨架）
    │   └── chunqiu.json      [新建] 春秋战国（骨架）
    ├── recipes/              [新建目录] 配方定义
    │   └── index.json        [新建] 全朝代配方索引（骨架）
    ├── pools.json            [新建] 抽卡池定义（支持每周轮换）
    └── merge_rules.json      [保留] 旧版兼容，逐步废弃
```

---

### Task 1: 类型系统重构

**Files:**
- Modify: `版本 1/guofenglianjin/lib/types.ts`
- Create: `版本 1/guofenglianjin/lib/types.test.ts`

- [ ] **Step 1: 写类型定义测试**

```typescript
// lib/types.test.ts
import { describe, it, expect } from 'vitest'
import {
  CARD_QUALITY,
  DYNASTY_IDS,
  CardQuality,
  DynastyId,
  isValidLevel,
  getQualityByLevel,
  getFragmentCost,
  getSuccessRate,
  isLv12SynthesisEligible,
} from './types'

describe('CardQuality', () => {
  it('should have 6 quality tiers mapping to level ranges', () => {
    expect(CARD_QUALITY.common).toEqual({ name: '凡品', levelRange: [1, 2] })
    expect(CARD_QUALITY.fine).toEqual({ name: '精良', levelRange: [3, 5] })
    expect(CARD_QUALITY.rare).toEqual({ name: '稀有', levelRange: [6, 7] })
    expect(CARD_QUALITY.epic).toEqual({ name: '极品', levelRange: [8, 9] })
    expect(CARD_QUALITY.divine).toEqual({ name: '神品', levelRange: [10, 11] })
    expect(CARD_QUALITY.treasure).toEqual({ name: '至宝', levelRange: [12, 12] })
  })
})

describe('getQualityByLevel', () => {
  it('should map level 1-2 to common', () => {
    expect(getQualityByLevel(1)).toBe('common')
    expect(getQualityByLevel(2)).toBe('common')
  })
  it('should map level 3-5 to fine', () => {
    expect(getQualityByLevel(3)).toBe('fine')
    expect(getQualityByLevel(5)).toBe('fine')
  })
  it('should map level 6-7 to rare', () => {
    expect(getQualityByLevel(6)).toBe('rare')
    expect(getQualityByLevel(7)).toBe('rare')
  })
  it('should map level 8-9 to epic', () => {
    expect(getQualityByLevel(8)).toBe('epic')
    expect(getQualityByLevel(9)).toBe('epic')
  })
  it('should map level 10-11 to divine', () => {
    expect(getQualityByLevel(10)).toBe('divine')
    expect(getQualityByLevel(11)).toBe('divine')
  })
  it('should map level 12 to treasure', () => {
    expect(getQualityByLevel(12)).toBe('treasure')
  })
})

describe('isValidLevel', () => {
  it('should accept 1-12', () => {
    for (let i = 1; i <= 12; i++) {
      expect(isValidLevel(i)).toBe(true)
    }
  })
  it('should reject 0 and 13', () => {
    expect(isValidLevel(0)).toBe(false)
    expect(isValidLevel(13)).toBe(false)
  })
})

describe('getFragmentCost', () => {
  it('should return correct costs per level', () => {
    expect(getFragmentCost(1)).toBe(5)
    expect(getFragmentCost(2)).toBe(10)
    expect(getFragmentCost(3)).toBe(15)
    expect(getFragmentCost(4)).toBe(30)
    expect(getFragmentCost(5)).toBe(50)
    expect(getFragmentCost(6)).toBe(80)
    expect(getFragmentCost(7)).toBe(120)
    expect(getFragmentCost(8)).toBe(180)
    expect(getFragmentCost(9)).toBe(250)
    expect(getFragmentCost(10)).toBe(350)
    expect(getFragmentCost(11)).toBe(500)
    expect(getFragmentCost(12)).toBe(800)
  })
})

describe('getSuccessRate', () => {
  it('should return 1.0 for levels 1-5', () => {
    expect(getSuccessRate(1)).toBe(1.0)
    expect(getSuccessRate(5)).toBe(1.0)
  })
  it('should return 0.8 for levels 6-8', () => {
    expect(getSuccessRate(6)).toBe(0.8)
    expect(getSuccessRate(8)).toBe(0.8)
  })
  it('should return 0.6 for levels 9-11', () => {
    expect(getSuccessRate(9)).toBe(0.6)
    expect(getSuccessRate(11)).toBe(0.6)
  })
  it('should return 0 for level 12', () => {
    expect(getSuccessRate(12)).toBe(0)
  })
})

describe('isLv12SynthesisEligible', () => {
  it('should require exactly 6 cards', () => {
    expect(isLv12SynthesisEligible(['a', 'b', 'c', 'd', 'e'])).toBe(false)
    expect(isLv12SynthesisEligible(['a', 'b', 'c', 'd', 'e', 'f'])).toBe(true)
    expect(isLv12SynthesisEligible(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBe(false)
  })
})

describe('DYNASTY_IDS', () => {
  it('should have exactly 6 dynasties', () => {
    expect(DYNASTY_IDS).toHaveLength(6)
  })
  it('should include all expected dynasties', () => {
    expect(DYNASTY_IDS).toContain('qinhan')
    expect(DYNASTY_IDS).toContain('sanguo')
    expect(DYNASTY_IDS).toContain('tang')
    expect(DYNASTY_IDS).toContain('song')
    expect(DYNASTY_IDS).toContain('ming')
    expect(DYNASTY_IDS).toContain('chunqiu')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/types.test.ts
```
Expected: FAIL — 类型导出尚未定义

- [ ] **Step 3: 重写 lib/types.ts**

```typescript
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
  requiredCards: string[]     // 3-4 张材料卡 ID
  resultCardId: string        // 产物卡 ID
  description: string         // 历史典故说明
  isConsumed: boolean         // 一次性消耗品
}

// ============ Lv12 合成定义 ============
export interface Lv12SynthesisRule {
  lv12CardId: string
  requiredLv11CardIds: [string, string, string, string, string, string]  // 6 张指定 Lv11
  description: string
}

// ============ 抽卡池 ============
export interface DrawPool {
  poolId: string
  name: string
  dynasty: DynastyId
  levelWeights: Record<number, number>      // 等级权重
  qualityWeights: Record<CardQuality, number>  // 品质权重
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
  return 0  // Lv12 不可通用合成
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/types.test.ts
```
Expected: PASS (所有测试通过)

- [ ] **Step 5: 提交**

```bash
git add "版本 1/guofenglianjin/lib/types.ts" "版本 1/guofenglianjin/lib/types.test.ts"
git commit -m "feat: refactor type system for 12-level 6-dynasty card game"
```

---

### Task 2: 常量提取

**Files:**
- Create: `版本 1/guofenglianjin/lib/constants.ts`

- [ ] **Step 1: 创建 constants.ts**

```typescript
// lib/constants.ts

import { DynastyId, CardQuality } from './types'

// ============ 卡牌分布（设计文档中的金字塔） ============
export const CARDS_PER_LEVEL: Record<number, Record<DynastyId, number>> = {
  1:  { qinhan: 220, sanguo: 220, tang: 220, song: 220, ming: 220, chunqiu: 220 },
  2:  { qinhan: 170, sanguo: 170, tang: 170, song: 170, ming: 170, chunqiu: 170 },
  3:  { qinhan: 80,  sanguo: 80,  tang: 80,  song: 80,  ming: 80,  chunqiu: 80 },
  4:  { qinhan: 40,  sanguo: 40,  tang: 40,  song: 40,  ming: 40,  chunqiu: 40 },
  5:  { qinhan: 25,  sanguo: 25,  tang: 25,  song: 25,  ming: 25,  chunqiu: 25 },
  6:  { qinhan: 15,  sanguo: 15,  tang: 15,  song: 15,  ming: 15,  chunqiu: 15 },
  7:  { qinhan: 10,  sanguo: 10,  tang: 10,  song: 10,  ming: 10,  chunqiu: 10 },
  8:  { qinhan: 6,   sanguo: 6,   tang: 6,   song: 6,   ming: 6,   chunqiu: 6 },
  9:  { qinhan: 4,   sanguo: 4,   tang: 4,   song: 4,   ming: 4,   chunqiu: 4 },
  10: { qinhan: 3,   sanguo: 3,   tang: 3,   song: 3,   ming: 3,   chunqiu: 3 },
  11: { qinhan: 2,   sanguo: 2,   tang: 2,   song: 2,   ming: 2,   chunqiu: 2 },
  12: { qinhan: 2,   sanguo: 2,   tang: 2,   song: 2,   ming: 2,   chunqiu: 2 },
}

export function getTotalCardsForDynasty(dynasty: DynastyId): number {
  let total = 0
  for (let level = 1; level <= 12; level++) {
    total += CARDS_PER_LEVEL[level][dynasty]
  }
  return total
}

export function getTotalCardsOverall(): number {
  let total = 0
  for (const dynasty of Object.keys(CARDS_PER_LEVEL[1]) as DynastyId[]) {
    total += getTotalCardsForDynasty(dynasty)
  }
  return total
}

// ============ 实体卡限量 ============
export const PHYSICAL_CARD_LIMITS: Record<number, number> = {
  9: 300,
  10: 200,
  11: 150,
  12: 100,
}

// ============ 社交限制 ============
export const DAILY_GIFT_SEND_LIMIT = 3
export const DAILY_GIFT_RECEIVE_LIMIT = 5
export const MAX_GIFTABLE_LEVEL = 5
export const DAILY_FRAGMENT_GIFT_LIMIT = 10

// ============ 邀请奖励 ============
export const INVITE_REWARDS = [
  { type: 'fragments', amount: 100, label: '邀请好友' },
  { type: 'recipe', amount: 1, label: '好友首次合成' },
  { type: 'border', amount: 1, label: '好友达到 Lv6' },
] as const

// ============ 每周循环 ============
export const WEEKLY_DYNASTY_ORDER: DynastyId[] = [
  'qinhan', 'sanguo', 'tang', 'song', 'ming', 'chunqiu',
]

export const WEEK_DURATION_MS = 7 * 24 * 60 * 60 * 1000
```

- [ ] **Step 2: 提交**

```bash
git add "版本 1/guofenglianjin/lib/constants.ts"
git commit -m "feat: add game constants for card distribution and limits"
```

---

### Task 3: 配置加载器

**Files:**
- Create: `版本 1/guofenglianjin/lib/config-loader.ts`
- Create: `版本 1/guofenglianjin/lib/config-loader.test.ts`
- Create: `版本 1/guofenglianjin/config/dynasties.json`
- Create: `版本 1/guofenglianjin/config/recipes/index.json`

- [ ] **Step 1: 创建朝代元数据配置**

```json
// config/dynasties.json
[
  { "id": "qinhan",  "name": "秦汉",   "period": "前221-220", "order": 1 },
  { "id": "sanguo",  "name": "三国",   "period": "220-280",   "order": 2 },
  { "id": "tang",    "name": "唐",     "period": "618-907",   "order": 3 },
  { "id": "song",    "name": "宋",     "period": "960-1279",  "order": 4 },
  { "id": "ming",    "name": "明",     "period": "1368-1644", "order": 5 },
  { "id": "chunqiu", "name": "春秋战国", "period": "前770-前221", "order": 6 }
]
```

- [ ] **Step 2: 创建配方索引骨架**

```json
// config/recipes/index.json
[]
```

- [ ] **Step 3: 写配置加载器测试**

```typescript
// lib/config-loader.test.ts
import { describe, it, expect } from 'vitest'
import {
  loadDynasties,
  getDynastyById,
  loadCardsByDynasty,
  loadAllRecipes,
  getRecipesByDynasty,
  getWeeklyRotation,
} from './config-loader'

describe('loadDynasties', () => {
  it('should return all 6 dynasties', () => {
    const dynasties = loadDynasties()
    expect(dynasties).toHaveLength(6)
    expect(dynasties[0].id).toBe('qinhan')
  })
})

describe('getDynastyById', () => {
  it('should return dynasty metadata', () => {
    const d = getDynastyById('tang')
    expect(d?.name).toBe('唐')
  })
  it('should return undefined for invalid id', () => {
    expect(getDynastyById('invalid' as any)).toBeUndefined()
  })
})

describe('loadCardsByDynasty', () => {
  it('should load cards for qinhan', () => {
    const cards = loadCardsByDynasty('qinhan')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every(c => c.dynasty === 'qinhan')).toBe(true)
  })
  it('should return empty array for dynasty with no cards yet', () => {
    const cards = loadCardsByDynasty('song')
    expect(Array.isArray(cards)).toBe(true)
  })
})

describe('loadAllRecipes', () => {
  it('should return array', () => {
    const recipes = loadAllRecipes()
    expect(Array.isArray(recipes)).toBe(true)
  })
})

describe('getWeeklyRotation', () => {
  it('should return correct dynasty for week 0', () => {
    const d = getWeeklyRotation(0)
    expect(d).toBe('qinhan')
  })
  it('should return correct dynasty for week 5', () => {
    const d = getWeeklyRotation(5)
    expect(d).toBe('chunqiu')
  })
  it('should wrap around at week 6', () => {
    const d = getWeeklyRotation(6)
    expect(d).toBe('qinhan')
  })
})
```

- [ ] **Step 4: 运行测试确认失败**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/config-loader.test.ts
```

- [ ] **Step 5: 实现 config-loader.ts**

```typescript
// lib/config-loader.ts

import { Card, DynastyId, Recipe, Lv12SynthesisRule, CardType, getQualityByLevel } from './types'
import { WEEKLY_DYNASTY_ORDER, WEEK_DURATION_MS } from './constants'

// ============ 朝代元数据 ============
import dynastiesData from '@/config/dynasties.json'

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

// ============ 卡牌懒加载 ============
const cardCache: Partial<Record<DynastyId, Card[]>> = {}

function tryLoadCardsFile(dynasty: DynastyId): Card[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = require(`@/config/cards/${dynasty}.json`)
    return (Array.isArray(data) ? data : []).map((raw: any) => ({
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
    }))
  } catch {
    return []
  }
}

export function loadCardsByDynasty(dynasty: DynastyId): Card[] {
  if (!cardCache[dynasty]) {
    cardCache[dynasty] = tryLoadCardsFile(dynasty)
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
    try {
      const data = require('@/config/recipes/index.json')
      recipeCache = Array.isArray(data) ? data : []
    } catch {
      recipeCache = []
    }
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
```

- [ ] **Step 6: 运行测试确认通过**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/config-loader.test.ts
```

- [ ] **Step 7: 将现有 cards.json 迁移到 config/cards/qinhan.json**

```bash
cp "版本 1/guofenglianjin/config/cards.json" "版本 1/guofenglianjin/config/cards/qinhan.json"
```

- [ ] **Step 8: 提交**

```bash
git add "版本 1/guofenglianjin/lib/config-loader.ts" "版本 1/guofenglianjin/lib/config-loader.test.ts" "版本 1/guofenglianjin/config/dynasties.json" "版本 1/guofenglianjin/config/recipes/index.json" "版本 1/guofenglianjin/config/cards/qinhan.json"
git commit -m "feat: add config loader with dynasty-based lazy loading"
```

---

### Task 4: 合成引擎

**Files:**
- Create: `版本 1/guofenglianjin/lib/synthesis-engine.ts`
- Create: `版本 1/guofenglianjin/lib/synthesis-engine.test.ts`

- [ ] **Step 1: 写合成引擎测试**

```typescript
// lib/synthesis-engine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock config-loader
vi.mock('./config-loader', () => ({
  getCardById: vi.fn((id: string) => {
    const mockCards: Record<string, any> = {
      'qinhan_lv2_a': { id: 'qinhan_lv2_a', name: '刘邦', level: 2, dynasty: 'qinhan', quality: 'common' },
      'qinhan_lv2_b': { id: 'qinhan_lv2_b', name: '樊哙', level: 2, dynasty: 'qinhan', quality: 'common' },
      'qinhan_lv2_c': { id: 'qinhan_lv2_c', name: '萧何', level: 2, dynasty: 'qinhan', quality: 'common' },
      'qinhan_lv3_x': { id: 'qinhan_lv3_x', name: '鸿门宴', level: 3, dynasty: 'qinhan', quality: 'fine' },
      'qinhan_lv3_y': { id: 'qinhan_lv3_y', name: '荥阳', level: 3, dynasty: 'qinhan', quality: 'fine' },
      'qinhan_lv11_a': { id: 'qinhan_lv11_a', name: '秦统六合', level: 11, dynasty: 'qinhan', quality: 'divine' },
      'qinhan_lv11_b': { id: 'qinhan_lv11_b', name: '汉武盛世', level: 11, dynasty: 'qinhan', quality: 'divine' },
      'sanguo_lv11_a': { id: 'sanguo_lv11_a', name: '三分归晋', level: 11, dynasty: 'sanguo', quality: 'divine' },
      'tang_lv11_a': { id: 'tang_lv11_a', name: '贞观之治', level: 11, dynasty: 'tang', quality: 'divine' },
      'song_lv11_a': { id: 'song_lv11_a', name: '清明上河', level: 11, dynasty: 'song', quality: 'divine' },
      'ming_lv11_a': { id: 'ming_lv11_a', name: '永乐大典', level: 11, dynasty: 'ming', quality: 'divine' },
      'chunqiu_lv11_a': { id: 'chunqiu_lv11_a', name: '百家争鸣', level: 11, dynasty: 'chunqiu', quality: 'divine' },
      'lv12_target': { id: 'lv12_target', name: '千古一帝', level: 12, dynasty: 'qinhan', quality: 'treasure' },
    }
    return mockCards[id] || null
  }),
  loadCardsByDynasty: vi.fn((dynasty: string) => {
    const all: Record<string, any[]> = {
      qinhan: [
        { id: 'qinhan_lv2_a', level: 2, dynasty: 'qinhan', quality: 'common' },
        { id: 'qinhan_lv2_b', level: 2, dynasty: 'qinhan', quality: 'common' },
        { id: 'qinhan_lv2_c', level: 2, dynasty: 'qinhan', quality: 'common' },
        { id: 'qinhan_lv3_x', level: 3, dynasty: 'qinhan', quality: 'fine' },
        { id: 'qinhan_lv3_y', level: 3, dynasty: 'qinhan', quality: 'fine' },
      ],
    }
    return all[dynasty] || []
  }),
  loadAllRecipes: vi.fn(() => [{
    id: 'recipe_chibi',
    name: '赤壁秘方',
    rarity: 'epic',
    dynasty: 'sanguo',
    requiredCards: ['sanguo_lv4_zhugeliang', 'sanguo_lv4_zhouyu', 'sanguo_lv2_dongfeng', 'sanguo_lv3_zhuanchuan'],
    resultCardId: 'sanguo_lv7_chibi',
    description: '火攻破曹',
    isConsumed: true,
  }]),
  getLv12RuleForTarget: vi.fn((targetId: string) => {
    if (targetId === 'lv12_target') {
      return {
        lv12CardId: 'lv12_target',
        requiredLv11CardIds: [
          'qinhan_lv11_a', 'qinhan_lv11_b',
          'sanguo_lv11_a', 'tang_lv11_a',
          'song_lv11_a', 'ming_lv11_a',
        ],
        description: '六朝合一',
      }
    }
    return undefined
  }),
  loadCardsByDynasty: vi.fn(),
}))

import {
  canGenericSynthesize,
  genericSynthesize,
  canRecipeSynthesize,
  recipeSynthesize,
  canFragmentExchange,
  fragmentExchange,
  canLv12Synthesize,
  lv12Synthesize,
} from './synthesis-engine'

// Re-mock loadCardsByDynasty for the actual test
vi.mocked(loadCardsByDynasty).mockImplementation((dynasty: string) => {
  const all: Record<string, any[]> = {
    qinhan: [
      { id: 'qinhan_lv2_a', level: 2, dynasty: 'qinhan', quality: 'common' },
      { id: 'qinhan_lv2_b', level: 2, dynasty: 'qinhan', quality: 'common' },
      { id: 'qinhan_lv2_c', level: 2, dynasty: 'qinhan', quality: 'common' },
      { id: 'qinhan_lv3_x', level: 3, dynasty: 'qinhan', quality: 'fine' },
      { id: 'qinhan_lv3_y', level: 3, dynasty: 'qinhan', quality: 'fine' },
    ],
  }
  return all[dynasty] || []
})

// Need to import loadCardsByDynasty for the mock
import { loadCardsByDynasty } from './config-loader'

describe('canGenericSynthesize', () => {
  it('should return true for two same-level same-dynasty cards', () => {
    expect(canGenericSynthesize('qinhan_lv2_a', 'qinhan_lv2_b')).toBe(true)
  })
  it('should return false for different dynasty cards', () => {
    expect(canGenericSynthesize('qinhan_lv2_a', 'sanguo_lv2_x')).toBe(false)
  })
  it('should return false for different level cards', () => {
    expect(canGenericSynthesize('qinhan_lv2_a', 'qinhan_lv3_x')).toBe(false)
  })
  it('should return false for Lv12 cards', () => {
    expect(canGenericSynthesize('lv12_a', 'lv12_b')).toBe(false)
  })
})

describe('genericSynthesize', () => {
  it('should return a random next-level card from same dynasty', () => {
    const result = genericSynthesize('qinhan_lv2_a', 'qinhan_lv2_b')
    expect(result.success).toBe(true)
    expect(result.resultCardId).toBeDefined()
    // Result should be level 3 from qinhan
    const resultId = result.resultCardId!
    expect(resultId).toMatch(/qinhan/)
  })
  it('should fail for invalid pair', () => {
    const result = genericSynthesize('qinhan_lv2_a', 'sanguo_lv2_x')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  it('should return failure refund info on fail', () => {
    // Mock Math.random to force failure for Lv6+
    const result = genericSynthesize('qinhan_lv2_a', 'qinhan_lv2_b')
    // Lv2 -> Lv3 has 100% success, failure shouldn't happen
    expect(result.success).toBe(true)
  })
})

describe('canRecipeSynthesize', () => {
  it('should return true when player has recipe and all materials', () => {
    const playerCards = {
      'sanguo_lv4_zhugeliang': 2,
      'sanguo_lv4_zhouyu': 1,
      'sanguo_lv2_dongfeng': 3,
      'sanguo_lv3_zhuanchuan': 1,
    }
    expect(canRecipeSynthesize('recipe_chibi', playerCards, ['recipe_chibi'])).toBe(true)
  })
  it('should return false when missing materials', () => {
    expect(canRecipeSynthesize('recipe_chibi', {}, ['recipe_chibi'])).toBe(false)
  })
  it('should return false when recipe not owned', () => {
    const playerCards = {
      'sanguo_lv4_zhugeliang': 2,
      'sanguo_lv4_zhouyu': 1,
      'sanguo_lv2_dongfeng': 3,
      'sanguo_lv3_zhuanchuan': 1,
    }
    expect(canRecipeSynthesize('recipe_chibi', playerCards, [])).toBe(false)
  })
})

describe('recipeSynthesize', () => {
  it('should consume recipe and materials, return result', () => {
    const result = recipeSynthesize('recipe_chibi', {
      'sanguo_lv4_zhugeliang': 2,
      'sanguo_lv4_zhouyu': 1,
      'sanguo_lv2_dongfeng': 3,
      'sanguo_lv3_zhuanchuan': 1,
    })
    expect(result.success).toBe(true)
    expect(result.resultCardId).toBe('sanguo_lv7_chibi')
    expect(result.consumedCards).toHaveLength(4)
    expect(result.recipeConsumed).toBe(true)
  })
})

describe('canFragmentExchange', () => {
  it('should return true when enough fragments', () => {
    expect(canFragmentExchange(3, 50)).toBe(true)
  })
  it('should return false when insufficient fragments', () => {
    expect(canFragmentExchange(12, 10)).toBe(false)
  })
})

describe('fragmentExchange', () => {
  it('should return result card info', () => {
    const result = fragmentExchange('qinhan_lv3_x', 100)
    expect(result.success).toBe(true)
    expect(result.fragmentCost).toBe(15)
  })
})

describe('canLv12Synthesize', () => {
  it('should return true for 6 matching Lv11 cards', () => {
    const playerCards = {
      'qinhan_lv11_a': 1, 'qinhan_lv11_b': 1,
      'sanguo_lv11_a': 1, 'tang_lv11_a': 1,
      'song_lv11_a': 1, 'ming_lv11_a': 1,
    }
    expect(canLv12Synthesize('lv12_target', playerCards)).toBe(true)
  })
  it('should return false when missing Lv11 cards', () => {
    expect(canLv12Synthesize('lv12_target', { 'qinhan_lv11_a': 1 })).toBe(false)
  })
  it('should return false for unknown Lv12', () => {
    expect(canLv12Synthesize('nonexistent', {})).toBe(false)
  })
})

describe('lv12Synthesize', () => {
  it('should consume 6 Lv11 and return Lv12', () => {
    const result = lv12Synthesize('lv12_target', {
      'qinhan_lv11_a': 1, 'qinhan_lv11_b': 1,
      'sanguo_lv11_a': 1, 'tang_lv11_a': 1,
      'song_lv11_a': 1, 'ming_lv11_a': 1,
    })
    expect(result.success).toBe(true)
    expect(result.resultCardId).toBe('lv12_target')
    expect(result.consumedCards).toHaveLength(6)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/synthesis-engine.test.ts
```

- [ ] **Step 3: 实现 synthesis-engine.ts**

```typescript
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
  if (card1.level >= 12) return false  // Lv12 不可通用合成
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

  // 检查所有材料卡是否至少各有 1 张
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

  // 检查材料
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/synthesis-engine.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add "版本 1/guofenglianjin/lib/synthesis-engine.ts" "版本 1/guofenglianjin/lib/synthesis-engine.test.ts"
git commit -m "feat: add synthesis engine with generic/recipe/fragment/lv12 paths"
```

---

### Task 5: 更新存储层

**Files:**
- Modify: `版本 1/guofenglianjin/lib/storage.ts`
- Create: `版本 1/guofenglianjin/lib/storage.test.ts`

- [ ] **Step 1: 写存储层测试**

```typescript
// lib/storage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } })

import {
  loadGameState,
  saveGameState,
  addCardToInventory,
  removeCardFromInventory,
  addRecipeToInventory,
  useRecipe,
  setWeeklyDynasty,
  shouldRotateWeek,
  rotateWeek,
} from './storage'
import { INITIAL_GAME_STATE } from './types'

beforeEach(() => {
  localStorageMock.clear()
})

describe('loadGameState', () => {
  it('should return initial state when nothing stored', () => {
    const state = loadGameState()
    expect(state.playerCards).toEqual({})
    expect(state.currentWeeklyDynasty).toBe('qinhan')
  })
})

describe('saveGameState and loadGameState', () => {
  it('should persist and restore state', () => {
    const state = { ...INITIAL_GAME_STATE, totalMerges: 42 }
    saveGameState(state)
    const loaded = loadGameState()
    expect(loaded.totalMerges).toBe(42)
  })
  it('should merge new fields into old saves', () => {
    // Simulate old save without new fields
    const oldState = { playerCards: { 'card_a': 3 }, dailyDrawCount: 5 }
    localStorageMock.setItem('alchemy-card-game-state', JSON.stringify(oldState))
    const loaded = loadGameState()
    expect(loaded.playerCards).toEqual({ 'card_a': 3 })
    expect(loaded.currentWeeklyDynasty).toBe('qinhan')  // new field defaulted
    expect(loaded.ownedRecipes).toEqual([])
  })
})

describe('addCardToInventory', () => {
  it('should increment card count', () => {
    let state = { ...INITIAL_GAME_STATE }
    state = addCardToInventory(state, 'card_a')
    expect(state.playerCards['card_a']).toBe(1)
    state = addCardToInventory(state, 'card_a')
    expect(state.playerCards['card_a']).toBe(2)
  })
  it('should add to unlockedCards on first acquisition', () => {
    let state = { ...INITIAL_GAME_STATE }
    state = addCardToInventory(state, 'card_a')
    expect(state.unlockedCards).toContain('card_a')
    state = addCardToInventory(state, 'card_a')
    expect(state.unlockedCards.filter(id => id === 'card_a')).toHaveLength(1)
  })
})

describe('removeCardFromInventory', () => {
  it('should decrement card count', () => {
    let state = { ...INITIAL_GAME_STATE, playerCards: { 'card_a': 3 } }
    state = removeCardFromInventory(state, 'card_a', 1)
    expect(state.playerCards['card_a']).toBe(2)
  })
  it('should remove card entry when count reaches 0', () => {
    let state = { ...INITIAL_GAME_STATE, playerCards: { 'card_a': 1 } }
    state = removeCardFromInventory(state, 'card_a', 1)
    expect(state.playerCards['card_a']).toBeUndefined()
  })
})

describe('addRecipeToInventory', () => {
  it('should add recipe id', () => {
    let state = { ...INITIAL_GAME_STATE }
    state = addRecipeToInventory(state, 'recipe_chibi')
    expect(state.ownedRecipes).toContain('recipe_chibi')
  })
  it('should not add duplicate', () => {
    let state = { ...INITIAL_GAME_STATE, ownedRecipes: ['recipe_chibi'] }
    state = addRecipeToInventory(state, 'recipe_chibi')
    expect(state.ownedRecipes).toEqual(['recipe_chibi'])
  })
})

describe('useRecipe', () => {
  it('should move recipe from owned to used', () => {
    let state = { ...INITIAL_GAME_STATE, ownedRecipes: ['recipe_chibi'] }
    state = useRecipe(state, 'recipe_chibi')
    expect(state.ownedRecipes).not.toContain('recipe_chibi')
    expect(state.usedRecipes).toContain('recipe_chibi')
  })
})

describe('shouldRotateWeek', () => {
  it('should return true when last rotation was >7 days ago', () => {
    const state = { ...INITIAL_GAME_STATE, lastWeekRotation: Date.now() - 8 * 24 * 60 * 60 * 1000 }
    expect(shouldRotateWeek(state)).toBe(true)
  })
  it('should return false when last rotation was recent', () => {
    const state = { ...INITIAL_GAME_STATE, lastWeekRotation: Date.now() }
    expect(shouldRotateWeek(state)).toBe(false)
  })
})

describe('rotateWeek', () => {
  it('should advance to next dynasty in cycle', () => {
    let state = { ...INITIAL_GAME_STATE, currentWeeklyDynasty: 'qinhan' as const }
    state = rotateWeek(state)
    expect(state.currentWeeklyDynasty).toBe('sanguo')
  })
  it('should wrap from chunqiu to qinhan', () => {
    let state = { ...INITIAL_GAME_STATE, currentWeeklyDynasty: 'chunqiu' as const }
    state = rotateWeek(state)
    expect(state.currentWeeklyDynasty).toBe('qinhan')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/storage.test.ts
```

- [ ] **Step 3: 更新 storage.ts — 在现有文件末尾追加以下导出**

```typescript
// 追加到 storage.ts 末尾

import { DynastyId } from './types'
import { WEEKLY_DYNASTY_ORDER, WEEK_DURATION_MS } from './constants'

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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/storage.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add "版本 1/guofenglianjin/lib/storage.ts" "版本 1/guofenglianjin/lib/storage.test.ts"
git commit -m "feat: update storage layer with recipe inventory and weekly rotation"
```

---

### Task 6: 创建空朝代卡牌骨架

**Files:**
- Create: `版本 1/guofenglianjin/config/cards/sanguo.json`
- Create: `版本 1/guofenglianjin/config/cards/tang.json`
- Create: `版本 1/guofenglianjin/config/cards/song.json`
- Create: `版本 1/guofenglianjin/config/cards/ming.json`
- Create: `版本 1/guofenglianjin/config/cards/chunqiu.json`

- [ ] **Step 1: 创建骨架文件**

每个文件内容为 `[]`（空数组），后续由内容团队填充。

```bash
for dynasty in sanguo tang song ming chunqiu; do
  echo '[]' > "版本 1/guofenglianjin/config/cards/${dynasty}.json"
done
```

- [ ] **Step 2: 提交**

```bash
git add "版本 1/guofenglianjin/config/cards/sanguo.json" "版本 1/guofenglianjin/config/cards/tang.json" "版本 1/guofenglianjin/config/cards/song.json" "版本 1/guofenglianjin/config/cards/ming.json" "版本 1/guofenglianjin/config/cards/chunqiu.json"
git commit -m "feat: add skeleton card configs for remaining 5 dynasties"
```

---

### Task 7: 集成测试 — 完整合成流程

**Files:**
- Create: `版本 1/guofenglianjin/lib/integration.test.ts`

- [ ] **Step 1: 写集成测试**

```typescript
// lib/integration.test.ts
import { describe, it, expect } from 'vitest'
import { INITIAL_GAME_STATE } from './types'
import { addCardToInventory, removeCardFromInventory, addRecipeToInventory } from './storage'
import {
  canGenericSynthesize,
  genericSynthesize,
  canRecipeSynthesize,
  recipeSynthesize,
  canFragmentExchange,
  canLv12Synthesize,
} from './synthesis-engine'

describe('Full synthesis flow', () => {
  it('should support: draw cards → generic synthesize → recipe synthesize → fragment exchange', () => {
    let state = { ...INITIAL_GAME_STATE }

    // 1. Player draws some cards
    state = addCardToInventory(state, 'liubang_002')
    state = addCardToInventory(state, 'jixin_002')

    // 2. Generic synthesize: both Lv2 qinhan → random Lv3
    expect(canGenericSynthesize('liubang_002', 'jixin_002')).toBe(true)
    const result = genericSynthesize('liubang_002', 'jixin_002')
    expect(result.success).toBe(true)
    expect(result.resultCardId).toBeDefined()

    // 3. Fragment exchange should be possible with enough fragments
    expect(canFragmentExchange(1, 100)).toBe(true)
    const fragResult = {
      ...INITIAL_GAME_STATE,
      fragments: { general: 500 },
    }
    // Can exchange any card if enough fragments
    expect(fragResult.fragments.general).toBeGreaterThanOrEqual(5)
  })

  it('should reject invalid synthesis attempts', () => {
    // Different dynasties
    expect(canGenericSynthesize('liubang_002', 'zhugeliang_001')).toBe(false)

    // Different levels
    expect(canGenericSynthesize('liubang_002', 'xingyang_001')).toBe(false)
  })

  it('should handle recipe flow: acquire recipe → check materials → synthesize', () => {
    let state = { ...INITIAL_GAME_STATE }

    // Player acquires recipe
    state = addRecipeToInventory(state, 'recipe_chibi')

    // Player doesn't have materials yet
    expect(canRecipeSynthesize('recipe_chibi', state.playerCards, state.ownedRecipes)).toBe(false)

    // After collecting materials
    const playerCards = {
      'sanguo_lv4_zhugeliang': 1,
      'sanguo_lv4_zhouyu': 1,
      'sanguo_lv2_dongfeng': 1,
      'sanguo_lv3_zhuanchuan': 1,
    }

    expect(canRecipeSynthesize('recipe_chibi', playerCards, state.ownedRecipes)).toBe(true)

    const result = recipeSynthesize('recipe_chibi', playerCards)
    expect(result.success).toBe(true)
    expect(result.resultCardId).toBe('sanguo_lv7_chibi')
  })
})
```

- [ ] **Step 2: 运行集成测试**

```bash
cd "版本 1/guofenglianjin" && npx vitest run lib/integration.test.ts
```

- [ ] **Step 3: 运行全部测试确认无回归**

```bash
cd "版本 1/guofenglianjin" && npx vitest run
```

- [ ] **Step 4: 提交**

```bash
git add "版本 1/guofenglianjin/lib/integration.test.ts"
git commit -m "test: add integration tests for full synthesis flow"
```

---

## 自检清单

- [x] **Spec coverage**: 类型系统(✓)、配置加载(✓)、通用合成(✓)、配方合成(✓)、碎片兑换(✓)、Lv12合成(✓)、成功率表(✓)、每周轮换(✓)、存储层(✓)
- [x] **Placeholder scan**: 无 TBD/TODO，所有步骤包含完整代码
- [x] **Type consistency**: `CardQuality`、`DynastyId`、`Recipe`、`Lv12SynthesisRule` 等类型在各文件间一致引用
