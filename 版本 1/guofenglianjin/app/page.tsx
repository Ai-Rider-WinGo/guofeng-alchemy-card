'use client'

import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { useGame } from '@/lib/gameContext'
import { loadCards } from '@/lib/cardUtils'
import { getCollectionProgress, getRemainingDraws } from '@/lib/storage'

const routeCards = [
  { step: 1, name: '刘邦', owned: '2/3', image: '/ui/reference-route-liubang.png' },
  { step: 2, name: '纪信', owned: '1/3', image: '/ui/reference-route-jixin.png' },
  { step: 3, name: '项羽', owned: '0/3', image: '/ui/reference-route-xiangyu.png' },
  { step: 4, name: '荥阳脱困', owned: '0/2', image: '/ui/reference-route-xingyang.png' },
  { step: 5, name: '楚汉相争', owned: '0/1', image: '/ui/reference-route-chuhan.png' },
]

const collectionStats = [
  { label: '历史人物', value: '68/128', mark: '人' },
  { label: '重大事件', value: '36/64', mark: '史' },
  { label: '典籍文物', value: '24/64', mark: '卷' },
]

const quickActions = [
  {
    href: '/draw',
    title: '抽卡',
    desc: '炉烟起烟，卡牌显现',
    image: '/ui/action-art-draw.png',
    cta: '前往抽卡',
    tone: 'green',
  },
  {
    href: '/merge',
    title: '合成',
    desc: '三卡合一，英雄进阶',
    image: '/ui/action-art-merge.png',
    cta: '前往合成',
    tone: 'gold',
  },
  {
    href: '/collection',
    title: '图鉴',
    desc: '解锁典藏，阅览历史',
    image: '/ui/action-art-archive.png',
    cta: '查看图鉴',
    tone: 'blue',
  },
]

export default function HomePage() {
  const { gameState } = useGame()
  const allCards = loadCards()
  const remainingDraws = Math.min(getRemainingDraws(gameState), 12)
  const collectionProgress = getCollectionProgress(gameState, allCards)
  const collectionTotal = Math.max(collectionProgress.total, 1)
  const progressPercent = Math.max(18, Math.min(100, Math.round((collectionProgress.unlocked / collectionTotal) * 100)))

  return (
    <PageLayout>
      <div className="home-shell">
        <header className="hero-header">
          <div className="brand-lockup">
            <p>楚汉篇</p>
            <h1>国风炼金卡牌</h1>
          </div>

          <Link href="/collection" className="atlas-chip" aria-label="打开图鉴">
            <span className="atlas-medal">册</span>
            <span>
              图鉴进度
              <strong>128/256</strong>
            </span>
          </Link>
        </header>

        <section className="daily-scroll-panel">
          <div className="scroll-art">
            <img src="/ui/reference-cauldron.png" alt="炼金炉鼎" />
            <img className="smoke-layer" src="/ui/reference-smoke.png" alt="" aria-hidden="true" />
          </div>

          <div className="draw-counter">
            <div className="panel-label">
              <span />
              今日抽卡
              <b>i</b>
            </div>
            <div className="draw-count">
              <strong>{remainingDraws}</strong>
              <span>/12</span>
            </div>
            <p>23:59:59 后重置</p>
            <div className="hero-actions">
              <Link href="/draw">卡池预览</Link>
              <Link href="/draw">抽卡记录</Link>
            </div>
          </div>

          <div className="reset-seal">每日重置</div>
        </section>

        <section className="route-section">
          <div className="ornate-title">
            <span />
            推荐合成路线
            <span />
          </div>

          <div className="route-frame">
            {routeCards.map((card, index) => (
              <div className="route-node" key={card.name}>
                <div className="node-rank">
                  <span>{card.step}</span>
                </div>
                <img src={card.image} alt={`${card.name}路线卡`} />
                <p className="node-owned">持有 {card.owned}</p>
                {index < routeCards.length - 1 && <b className="node-arrow">›</b>}
              </div>
            ))}
          </div>
        </section>

        <section className="collection-panel">
          <div className="ornate-title compact">
            <span />
            收藏进度
            <span />
          </div>

          <div className="collection-grid">
            {collectionStats.map((item) => (
              <div className="collection-stat" key={item.label}>
                <b>{item.mark}</b>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
            <Link href="/collection" className="collection-total">
              <span>藏</span>
              收集总览
            </Link>
          </div>

          <div className="runtime-progress">
            <i style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="runtime-caption">
            本地原型图鉴：{collectionProgress.unlocked}/{collectionProgress.total}
          </p>
        </section>

        <section className="action-grid">
          {quickActions.map((action) => (
            <Link className={`feature-card ${action.tone}`} href={action.href} key={action.title}>
              <img src={action.image} alt="" aria-hidden="true" />
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
