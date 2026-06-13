'use client'

import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { useGame } from '@/lib/gameContext'
import { loadCards } from '@/lib/cardUtils'
import { getCollectionProgress, getRemainingDraws } from '@/lib/storage'

const routeCards = [
  { step: 1, name: '刘邦', owned: '2/3', image: '/art/liubang-card.png' },
  { step: 2, name: '纪信', owned: '1/3', image: '/art/chronicle-cardback.png' },
  { step: 3, name: '项羽', owned: '0/3', image: '/art/xiangyu-card.png' },
  { step: 4, name: '荥阳脱困', owned: '0/2', image: '/art/chronicle-cardback.png' },
  { step: 5, name: '楚汉相争', owned: '0/1', image: '/art/chronicle-cardback.png' },
]

const collectionStats = [
  { label: '历史人物', value: '68/128' },
  { label: '重大事件', value: '36/64' },
  { label: '典籍文物', value: '24/64' },
]

const quickActions = [
  {
    href: '/draw',
    title: '抽卡',
    desc: '卡牌显现',
    image: '/art/chronicle-cardback.png',
    cta: '前往抽卡',
  },
  {
    href: '/merge',
    title: '合成',
    desc: '三卡合一，英雄进阶',
    image: '/art/liubang-card.png',
    cta: '前往合成',
  },
  {
    href: '/collection',
    title: '图鉴',
    desc: '解锁典藏，阅览历史',
    image: '/art/chronicle-cardback.png',
    cta: '查看图鉴',
  },
]

export default function HomePage() {
  const { gameState } = useGame()
  const allCards = loadCards()
  const remainingDraws = getRemainingDraws(gameState)
  const collectionProgress = getCollectionProgress(gameState, allCards)
  const progressPercent =
    collectionProgress.total === 0
      ? 0
      : Math.round((collectionProgress.unlocked / collectionProgress.total) * 100)

  return (
    <PageLayout>
      <div className="mx-auto min-h-screen max-w-[430px] px-4 pb-28 pt-5 text-paper">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-bronze/70">楚汉篇 · 第一章</p>
            <h1 className="mt-2 text-[34px] font-black leading-none tracking-[0.08em] text-paper">
              国风炼金卡牌
            </h1>
          </div>
          <Link
            href="/collection"
            className="h-11 w-11 rounded-full border border-bronze/45 bg-ink-2/80 text-center text-xl leading-[42px] text-bronze shadow-inner"
            aria-label="打开图鉴"
          >
            册
          </Link>
        </header>

        <section className="paper-panel relative overflow-hidden p-4">
          <div className="absolute right-3 top-3 rounded-full border border-bronze/30 px-3 py-1 text-xs text-bronze">
            每日重置
          </div>

          <div className="grid grid-cols-[126px_1fr] gap-4">
            <div className="relative h-44 overflow-hidden rounded-[10px] border border-bronze/35 bg-ink">
              <img
                src="/art/liubang-card.png"
                alt="刘邦卡牌"
                className="h-full w-full object-cover opacity-95"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                <p className="text-sm font-bold text-paper">刘邦</p>
                <p className="text-[11px] text-bronze">秦汉之际 · 关键人物</p>
              </div>
            </div>

            <div className="flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <span className="h-2 w-2 rotate-45 bg-bronze" />
                  今日抽卡
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-[64px] font-black leading-none text-ink">{remainingDraws}</span>
                  <span className="pb-2 text-2xl font-bold text-ink/60">/ 20</span>
                </div>
                <p className="mt-2 text-sm text-ink/60">每日免费次数，抽取楚汉基础卡。</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/draw" className="seal-button text-center">
                  当前卡池
                </Link>
                <Link href="/draw" className="seal-button text-center">
                  抽卡记录
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="section-title">
            <span />
            推荐合成路线
            <span />
          </div>

          <div className="route-scroll mt-4">
            {routeCards.map((card, index) => (
              <div className="route-item" key={card.name}>
                <div className="route-step">{card.step}</div>
                <div className="route-card">
                  <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
                  <div className="route-name">{card.name}</div>
                </div>
                <p className="mt-2 text-center text-xs text-bronze/80">持有 {card.owned}</p>
                {index < routeCards.length - 1 && <div className="route-arrow">›</div>}
              </div>
            ))}
          </div>
        </section>

        <section className="archive-panel mt-6">
          <div className="section-title">
            <span />
            收藏进度
            <span />
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-bronze/20">
            {collectionStats.map((item) => (
              <div className="px-2 text-center" key={item.label}>
                <p className="text-xs text-paper/55">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-paper">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-full border border-bronze/25 bg-black/30 p-1">
            <div className="h-2 rounded-full bg-gradient-to-r from-jade via-bronze to-bronze/50" style={{ width: `${Math.max(progressPercent, 12)}%` }} />
          </div>
          <p className="mt-2 text-center text-xs text-paper/50">
            本地原型图鉴：{collectionProgress.unlocked}/{collectionProgress.total}
          </p>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link className="action-card" href={action.href} key={action.title}>
              <div className="h-24 overflow-hidden rounded-md border border-bronze/20 bg-black/30">
                <img src={action.image} alt="" className="h-full w-full object-cover opacity-80" />
              </div>
              <h2>{action.title}</h2>
              <p>{action.desc}</p>
              <span>{action.cta} ›</span>
            </Link>
          ))}
        </section>
      </div>
    </PageLayout>
  )
}
