'use client'

import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { useGame } from '@/lib/gameContext'
import { getRemainingDraws, getCollectionProgress } from '@/lib/storage'
import { loadCards } from '@/lib/cardUtils'

export default function ProfilePage() {
  const { gameState } = useGame()
  const allCards = loadCards()
  const ownedCount = Object.keys(gameState.playerCards).length
  const collectionProgress = getCollectionProgress(gameState, allCards)
  const starUpCandidates = Object.entries(gameState.playerCards).filter(([, count]) => count >= 3).length
  const totalFragments = Object.values(gameState.fragments || {}).reduce((a, b) => a + b, 0)

  const shortcutLinks = [
    { href: '/tasks', title: '任务中心', desc: '每日 & 成就', image: '/ui/action-art-archive.png', tone: 'green' as const },
    { href: '/signin', title: '每日签到', desc: `连续 ${gameState.signIn?.streak || 0} 天`, image: '/ui/nav-home.png', tone: 'gold' as const },
    { href: '/collection', title: '我的卡册', desc: `${collectionProgress.unlocked}/${collectionProgress.total}`, image: '/ui/action-art-archive.png', tone: 'blue' as const },
    { href: '/merge', title: '合成工坊', desc: `${gameState.totalMerges || 0} 次`, image: '/ui/action-art-merge.png', tone: 'gold' as const },
  ]

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">玩家档案</p>
            <h1 className="screen-title">我的</h1>
          </div>
          <Link href="/collection" className="atlas-chip">
            <span className="atlas-medal">册</span>
            <span>图鉴进度<strong>{collectionProgress.unlocked}/{collectionProgress.total}</strong></span>
          </Link>
        </header>

        <section className="daily-scroll-panel">
          <div className="scroll-art flex items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-bronze/40 bg-jade/20 text-5xl font-black text-bronze">史</div>
          </div>
          <div className="draw-counter">
            <div className="panel-label"><span />楚汉藏家<b>!</b></div>
            <div className="py-3 text-center">
              <p className="text-xs text-ink/60">秦汉之际 · 初入史册</p>
              <div className="mt-2 h-2 w-full rounded-full border border-bronze/20 bg-black/10">
                <div className="h-full rounded-full bg-gradient-to-r from-jade to-bronze" style={{ width: `${Math.min((collectionProgress.unlocked / Math.max(collectionProgress.total, 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="hero-actions">
              <Link href="/tasks">任务中心</Link>
              <Link href="/signin">每日签到</Link>
            </div>
          </div>
          <div className="reset-seal">{ownedCount} 种卡</div>
        </section>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: '持有卡种', value: ownedCount, emoji: '🃏' },
            { label: '可升星', value: starUpCandidates, emoji: '⭐' },
            { label: '碎片库存', value: totalFragments, emoji: '💎' },
          ].map((r) => (
            <div key={r.label} className="bronze-panel text-center py-3 px-1">
              <span className="text-xl">{r.emoji}</span>
              <p className="text-xs text-parchment/60 mt-1">{r.label}</p>
              <p className="mt-0.5 text-lg font-bold text-parchment">{r.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3">
          {shortcutLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`feature-card !min-h-[180px] ${link.tone}`}>
              <img src={link.image} alt="" aria-hidden="true" className="!bottom-10 !h-16" />
              <h2 className="!text-xl">{link.title}</h2>
              <p>{link.desc}</p>
              <span>前往 ›</span>
            </Link>
          ))}
        </section>

        <section className="collection-panel mt-5">
          <div className="ornate-title compact"><span />今日状态<span /></div>
          <div className="collection-grid !grid-cols-3">
            <div className="collection-stat"><b>抽</b><span>剩余抽卡</span><strong className="!text-jade">{getRemainingDraws(gameState)}</strong></div>
            <div className="collection-stat"><b>碎</b><span>碎片库存</span><strong>{totalFragments}</strong></div>
            <div className="collection-stat"><b>终</b><span>终极卡</span><strong>{gameState.ultimateCards.length}</strong></div>
          </div>
        </section>

        <Link href="/" className="ghost-button w-full text-center block mt-5">返回首页</Link>
      </div>
    </PageLayout>
  )
}
