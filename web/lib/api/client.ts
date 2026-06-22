// lib/api/client.ts — 后端 API fetch 封装
// 统一处理 { code, data, message } 响应信封、错误、token

const API_BASE = '/api'

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public raw?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  /** 是否需要玩家 token（默认 false，公开端点不需要） */
  auth?: boolean
  /** 走完整 URL（SSR 场景，浏览器走相对路径走 next rewrites 代理） */
  absoluteUrl?: string
}

/** 基础请求函数，自动解包 { code, data } 信封 */
export async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = false } = opts

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (auth) {
    const token = getPlayerToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  let payload: any = null
  const text = await res.text()
  try {
    payload = JSON.parse(text)
  } catch {
    throw new ApiError(res.status, `非 JSON 响应: ${text.slice(0, 120)}`)
  }

  if (!res.ok) {
    const msg = payload?.message || payload?.error || `HTTP ${res.status}`
    throw new ApiError(res.status, msg, payload)
  }

  // 后端统一信封 { code, data, message }
  if (payload && typeof payload === 'object' && 'code' in payload) {
    if (payload.code === 0) return payload.data as T
    throw new ApiError(res.status, payload.message || `业务错误 code=${payload.code}`, payload)
  }

  // 兼容直接返回数据的接口
  return payload as T
}

// ============ 玩家 token 管理（第 3 步联机化用） ============

const PLAYER_TOKEN_KEY = 'gf_player_token'

export function getPlayerToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(PLAYER_TOKEN_KEY)
}

export function setPlayerToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLAYER_TOKEN_KEY, token)
}

export function clearPlayerToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PLAYER_TOKEN_KEY)
}
