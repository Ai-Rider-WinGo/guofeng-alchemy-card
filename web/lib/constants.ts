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
