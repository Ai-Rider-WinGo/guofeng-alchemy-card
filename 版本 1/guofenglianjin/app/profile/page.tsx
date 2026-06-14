'use client'

import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { useGame } from '@/lib/gameContext'
import { getRemainingDraws } from '@/lib/storage'

export default function ProfilePage() {
  const { gameState } = useGame()
  const ownedCount = Object.keys(gameState.playerCards).length

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">玩家档案</p>
            <h1 className="screen-title">我的藏馆</h1>
            <p className="screen-subtitle">查看当前卡册、抽卡余量与收集状态。</p>
          </div>
          <Link href="/" className="ghost-button shrink-0 px-3 py-2">
            首页
          </Link>
        </header>

        <section className="bronze-panel p-4">
          <div className="relative z-10 flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-bronze/35 bg-black/25 text-2xl font-black text-bronze">
              史
            </div>
            <div>
              <h2 className="text-xl font-black text-parchment">楚汉藏家</h2>
              <p className="mt-1 text-xs font-bold tracking-[0.18em] text-bronze/60">秦汉之际 · 初入史册</p>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-3 divide-x divide-bronze/20 text-center">
            {[
              ['持有卡种', ownedCount],
              ['剩余抽卡', getRemainingDraws(gameState)],
              ['终极卡', gameState.ultimateCards.length],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-parchment/50">{label}</p>
                <p className="mt-1 text-xl font-black text-bronze">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bronze-panel mt-5 p-4">
          <div className="relative z-10">
            <div className="ornate-title compact">
              <span />
              今日行动
              <span />
            </div>
            <div className="mt-4 grid gap-3">
              <Link href="/collection" className="ritual-button text-center">
                查看我的卡册
              </Link>
              <Link href="/draw" className="ghost-button text-center">
                今日抽卡
              </Link>
              <Link href="/merge" className="ghost-button text-center">
                检查合成路线
              </Link>
            </div>
          </div>
        </section>

        <section className="parchment-strip mt-5 text-center">
          <p className="text-sm font-black tracking-[0.16em]">藏馆札记</p>
          <p className="mt-2 text-xs leading-5 text-ink/65">
            先完成楚汉主题卡池的抽卡、合成与图鉴点亮，后续再开放周常收集奖励。
          </p>
        </section>
      </div>
    </PageLayout>
  )
}
