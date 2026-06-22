// lib/api/public.ts — 公开只读 API 封装（无需登录）
// 数据来源：后端 /api/public/* （权威源 = 后端 cards/pools/merge_rules/game_configs 表）

import { request } from './client'

// ============ 类型（对齐后端实体） ============

export interface BackendCard {
  id: number
  card_id: string
  name: string
  rarity: 'N' | 'R' | 'SR' | 'SSR' | 'UR'
  dynasty: string // 显示名，如 "秦汉"
  dynasty_tag: string | null // 如 "qin_han"
  level: number
  type: 'person' | 'event' | 'weapon' | 'classic' | 'place' | 'dynasty'
  short_desc: string | null
  story: string | null
  knowledge_point: string | null
  tags: string[] | null
  related_cards: string[] | null
  merge_paths: { target: string; partner: string; desc: string }[] | null
  star_max: number
  image_url: string | null
  thumbnail_url: string | null
  is_active: boolean
}

export interface BackendDrawPool {
  id: number
  pool_id: string
  name: string
  type: 'permanent' | 'weekly_dynasty' | 'limited_premium'
  rarity_weights: Record<string, number>
  featured_card_ids: string[]
  dynasty_tag: string | null
  ticket_type: string | null
  pity_config: { sr_every: number; ssr_every: number; ssr_hard_pity: number; description: string } | null
  collection_target: number | null
  rotation_schedule: { dynasty: string; start_date: string; end_date: string; interval_weeks: number } | null
  is_active: boolean
}

export interface BackendMergeRule {
  id: number
  rule_id: string
  rule_name: string
  input_a: string
  input_b: string
  output_card_id: string
  target_level: number | null
  success_rate: number
  consume_inputs: boolean
  require_owned: boolean
  merge_desc: string | null
  is_active: boolean
}

export interface BootstrapData {
  generated_at: string
  cards: BackendCard[]
  pools: BackendDrawPool[]
  merge_rules: BackendMergeRule[]
  configs: Record<string, { key: string; value: any; description: string }[]>
  stats: {
    total_cards: number
    by_dynasty: { name: string; count: number }[]
    by_rarity: { name: string; count: number }[]
    by_type: { name: string; count: number }[]
  }
}

// ============ API 方法 ============

export function getBootstrap(): Promise<BootstrapData> {
  return request<BootstrapData>('/public/bootstrap')
}

// 简单的 GET with query 辅助
async function fetchGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const qs = params
    ? '?' + Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  return request<T>(`${path}${qs}`)
}

export function getPublicCards(params?: {
  dynasty?: string
  rarity?: string
  type?: string
  keyword?: string
  page?: number
  limit?: number
}): Promise<{ list: BackendCard[]; total: number; page: number; limit: number }> {
  return fetchGet('/public/cards', params)
}

// 缓存 bootstrap，避免首屏重复请求
let bootstrapCache: BootstrapData | null = null
let bootstrapPromise: Promise<BootstrapData> | null = null

export function getBootstrapCached(): Promise<BootstrapData> {
  if (bootstrapCache) return Promise.resolve(bootstrapCache)
  if (bootstrapPromise) return bootstrapPromise
  bootstrapPromise = getBootstrap().then((d) => {
    bootstrapCache = d
    bootstrapPromise = null
    return d
  })
  return bootstrapPromise
}

export function clearBootstrapCache() {
  bootstrapCache = null
}
