'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { register, login, isLoggedIn } from '@/lib/api/game'
import { useToast } from '@/components/Toast'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  // 已登录直接跳首页
  if (typeof window !== 'undefined' && isLoggedIn()) {
    router.replace('/')
  }

  const handleSubmit = async () => {
    if (!username || !password) {
      showToast('请输入用户名和密码', 'error')
      return
    }
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(username, password, nickname || undefined)
        showToast('注册成功，欢迎加入！', 'reward', '🎉')
      } else {
        await login(username, password)
        showToast('登录成功', 'success', '✓')
      }
      router.push('/')
    } catch (e: any) {
      showToast(e.message || '操作失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">国风炼金</p>
            <h1 className="screen-title">{mode === 'login' ? '玩家登录' : '注册账号'}</h1>
            <p className="screen-subtitle">登录后联网游玩，进度云端保存</p>
          </div>
        </header>

        {/* 模式切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-sm text-sm font-bold transition-all ${mode === 'login' ? 'btn-primary-gold' : 'bg-paper/10 text-paper/50'}`}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-sm text-sm font-bold transition-all ${mode === 'register' ? 'btn-primary-gold' : 'bg-paper/10 text-paper/50'}`}
          >
            注册
          </button>
        </div>

        <div className="bronze-panel p-4 space-y-3">
          <div>
            <label className="text-xs text-parchment/60 mb-1 block">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-32 位"
              className="w-full px-3 py-2 bg-black/30 border border-bronze/30 rounded-sm text-parchment focus:outline-none focus:border-bronze"
            />
          </div>
          <div>
            <label className="text-xs text-parchment/60 mb-1 block">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full px-3 py-2 bg-black/30 border border-bronze/30 rounded-sm text-parchment focus:outline-none focus:border-bronze"
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="text-xs text-parchment/60 mb-1 block">昵称（选填）</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="游戏中显示的名字"
                className="w-full px-3 py-2 bg-black/30 border border-bronze/30 rounded-sm text-parchment focus:outline-none focus:border-bronze"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="ritual-button w-full mt-4 py-4 rounded-sm text-lg font-black tracking-[0.1em]"
        >
          {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
        </button>

        <Link href="/" className="btn-secondary-dark w-full text-center block mt-3">
          游客模式继续
        </Link>

        <p className="text-xs text-parchment/40 text-center mt-4 leading-relaxed">
          游客模式下进度仅保存在本机；<br />
          登录后抽卡/签到/背包将联网保存。
        </p>
      </div>
    </PageLayout>
  )
}
