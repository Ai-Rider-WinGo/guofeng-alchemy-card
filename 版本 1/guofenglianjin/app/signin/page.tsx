'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { useGame } from '@/lib/gameContext'
import { doSignIn } from '@/lib/storage'
import signInRewards from '@/config/signin_rewards.json'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const rewards = (signInRewards as { cycle: number; rewards: Array<{ day: number; type: string; amount: number; label: string }> }).rewards

export default function SignInPage() {
  const { gameState, updateGameState } = useGame()
  const [justClaimed, setJustClaimed] = useState<string | null>(null)

  const streak = gameState.signIn?.streak || 0
  const currentDay = gameState.signIn?.currentCycleDay || 1
  const today = new Date().toISOString().slice(0, 10)
  const alreadySignedToday = gameState.signIn?.lastSignInDate === today

  const handleSignIn = () => {
    const { newState, reward } = doSignIn(gameState)
    updateGameState(newState)
    if (reward) { setJustClaimed(reward.label); setTimeout(() => setJustClaimed(null), 2500) }
  }

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">每日签到</p>
            <h1 className="screen-title">签到</h1>
          </div>
          <Link href="/tasks" className="atlas-chip">
            <span className="atlas-medal">任</span>
          </Link>
        </header>

        {/* 连续签到 — 宣纸英雄面板 */}
        <section className="daily-scroll-panel">
          <div className="scroll-art">
            <img src="/ui/reference-cauldron.png" alt="签到" />
            <img className="smoke-layer" src="/ui/reference-smoke.png" alt="" aria-hidden="true" />
          </div>

          <div className="draw-counter">
            <div className="panel-label">
              <span />
              已连续
              <b>{alreadySignedToday ? '✓' : '?'}</b>
            </div>
            <div className="draw-count">
              <strong>{streak}</strong>
              <span>天</span>
            </div>
            <p>7 天一轮回</p>
            <div className="hero-actions">
              <span className="text-center text-parchment/60 text-xs py-2">
                {alreadySignedToday ? '明日继续' : '今日待签'}
              </span>
            </div>
          </div>

          <div className="reset-seal">{alreadySignedToday ? '已签' : '待签'}</div>
        </section>

        {/* 签到格子 */}
        <section className="bronze-panel mt-5 p-4">
          <div className="ornate-title compact mb-3">
            <span />本周签到<span />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {rewards.map((reward) => {
              const isPast = reward.day < currentDay
              const isToday = reward.day === currentDay
              const isFuture = reward.day > currentDay
              let borderClass = 'border-bronze/15 bg-black/20 opacity-50'
              let emoji = '🔒'
              if (alreadySignedToday && isToday) { borderClass = 'border-jade/40 bg-jade/10'; emoji = '✅' }
              else if (isPast) { borderClass = 'border-jade/30 bg-jade/5 opacity-70'; emoji = '✅' }
              else if (isToday) { borderClass = 'border-bronze bg-bronze/10'; emoji = '🎁' }

              return (
                <div key={reward.day} className={`flex flex-col items-center gap-1 rounded-card border p-2 transition-all ${borderClass}`}>
                  <span className="text-xs font-bold text-parchment/70">{WEEKDAYS[reward.day - 1]}</span>
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[10px] text-parchment/50 text-center leading-tight">{reward.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <div className="mt-5">
          <button onClick={handleSignIn} disabled={alreadySignedToday}
            className={`w-full py-4 rounded-sm text-lg font-black tracking-[0.1em] transition-all ${
              alreadySignedToday ? 'bg-paper/10 text-paper/30 cursor-not-allowed' : 'ritual-button'
            }`}>
            {alreadySignedToday ? '今日已签到 ✅' : '签到领取奖励'}
          </button>
        </div>

        {justClaimed && (
          <div className="mt-4 animate-slide-up text-center">
            <div className="inline-block rounded-full border border-jade/40 bg-jade/10 px-5 py-2">
              <span className="text-sm font-bold text-jade">🎉 获得 {justClaimed}</span>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
