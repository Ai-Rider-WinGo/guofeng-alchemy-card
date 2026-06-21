// lib/api/game.ts — 玩家运行时 API 封装（需玩家 JWT）
// 对应后端 /api/game/* 路由

import { request, getPlayerToken, setPlayerToken, clearPlayerToken } from './client'

// ============ 账号 ============

export interface AuthResult {
  token: string
  player: {
    id: number
    username: string
    nickname: string | null
    avatar_url: string | null
    level: number
    coins: number
  }
}

export async function register(username: string, password: string, nickname?: string): Promise<AuthResult> {
  const res = await request<AuthResult>('/game/auth/register', { method: 'POST', body: { username, password, nickname } })
  setPlayerToken(res.token)
  return res
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const res = await request<AuthResult>('/game/auth/login', { method: 'POST', body: { username, password } })
  setPlayerToken(res.token)
  return res
}

export async function getProfile() {
  return request('/game/auth/profile', { auth: true })
}

export function logout() {
  clearPlayerToken()
}

export function isLoggedIn(): boolean {
  return !!getPlayerToken()
}

// ============ 抽卡 ============

export interface DrawnCard {
  card_id: string
  name: string
  rarity: string
  level: number
  dynasty: string
  image_url: string | null
  thumbnail_url: string | null
}

export interface DrawResult {
  pool_id: string
  drawn: DrawnCard[]
  today_count: number
  daily_limit: number
  remaining: number
}

export async function draw(poolId: string, count: number = 1): Promise<DrawResult> {
  return request<DrawResult>('/game/draw', { method: 'POST', auth: true, body: { pool_id: poolId, count } })
}

export async function getDrawRemaining() {
  return request<{ daily_limit: number; today_count: number; remaining: number }>('/game/draw/remaining', { auth: true })
}

export async function getInventory() {
  return request<{ id: number; card_id: string; quantity: number; star_level: number }[]>('/game/draw/inventory', { auth: true })
}

export async function getCollection() {
  return request<{ unlocked: string[]; count: number }>('/game/draw/collection', { auth: true })
}

export async function getFragments(): Promise<Record<string, number>> {
  return request<Record<string, number>>('/game/draw/fragments', { auth: true })
}

// ============ 合成 ============

export interface MergeResult {
  success: boolean
  result_card_id?: string
  name?: string
  rate?: number
  error?: string
  fragment_cost?: number
}

export function mergeGeneric(card1Id: string, card2Id: string): Promise<MergeResult> {
  return request<MergeResult>('/game/merge/generic', { method: 'POST', auth: true, body: { card1_id: card1Id, card2_id: card2Id } })
}

export function mergeRecipe(ruleId: string): Promise<MergeResult> {
  return request<MergeResult>('/game/merge/recipe', { method: 'POST', auth: true, body: { rule_id: ruleId } })
}

export function mergeFragment(targetCardId: string, shardKey: string): Promise<MergeResult> {
  return request<MergeResult>('/game/merge/fragment', { method: 'POST', auth: true, body: { target_card_id: targetCardId, shard_key: shardKey } })
}

export function mergeLv12(cardIds: string[]): Promise<MergeResult> {
  return request<MergeResult>('/game/merge/lv12', { method: 'POST', auth: true, body: { card_ids: cardIds } })
}

// ============ 签到/日常 ============

export interface SigninStatus {
  today: string
  signed_today: boolean
  streak: number
  total_days: number
  rewards_table: { day: number; rewards: { type: string; amount: number }[] }[]
}

export function getSigninStatus(): Promise<SigninStatus> {
  return request<SigninStatus>('/game/daily/signin/status', { auth: true })
}

export function doSignin() {
  return request<{ success: boolean; signin_date: string; streak: number; rewards: { type: string; amount: number }[] }>('/game/daily/signin', { method: 'POST', auth: true })
}

export function getPlayerInfo() {
  return request<{ id: number; username: string; nickname: string | null; avatar_url: string | null; level: number; exp: number; coins: number; vip_level: number }>('/game/daily/player', { auth: true })
}
