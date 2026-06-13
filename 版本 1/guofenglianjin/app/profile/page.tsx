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
      <div className="mx-auto min-h-screen max-w-[430px] px-4 pb-28 pt-6 text-paper">
        <header className="mb-6">
          <p className="text-xs tracking-[0.35em] text-bronze/70">玩家档案</p>
          <h1 className="mt-2 text-3xl font-black tracking-[0.08em]">我的</h1>
        </header>

        <section className="archive-panel">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-bronze/40 bg-jade/20 text-2xl font-black text-bronze">
              史
            </div>
            <div>
              <h2 className="text-xl font-bold text-paper">楚汉藏家</h2>
              <p className="mt-1 text-sm text-paper/55">秦汉之际 · 初入史册</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 divide-x divide-bronze/20 text-center">
            <div>
              <p className="text-xs text-paper/50">持有卡种</p>
              <p className="mt-1 text-lg font-bold">{ownedCount}</p>
            </div>
            <div>
              <p className="text-xs text-paper/50">今日抽卡</p>
              <p className="mt-1 text-lg font-bold">{getRemainingDraws(gameState)}</p>
            </div>
            <div>
              <p className="text-xs text-paper/50">终极卡</p>
              <p className="mt-1 text-lg font-bold">{gameState.ultimateCards.length}</p>
            </div>
          </div>
        </section>

        <div className="mt-5 space-y-3">
          <Link href="/collection" className="seal-button block py-3 text-center">
            查看我的卡册
          </Link>
          <Link href="/" className="seal-button block py-3 text-center">
            返回首页
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
