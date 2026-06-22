'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { InventoryCardDetailModal } from '@/components/InventoryCardDetailModal'
import { useGame } from '@/lib/gameContext'
import { loadCards } from '@/lib/cardUtils'
import { CARD_QUALITY, DYNASTY_META, type Card, type CardQuality, type DynastyId } from '@/lib/types'

type FilterValue<T extends string> = T | 'all'

const qualityEntries = Object.entries(CARD_QUALITY) as Array<[CardQuality, { name: string }]>
const dynastyEntries = Object.entries(DYNASTY_META) as Array<[DynastyId, { name: string }]>

export default function InventoryPage() {
  const { gameState } = useGame()
  const allCards = loadCards()
  const [qualityFilter, setQualityFilter] = useState<FilterValue<CardQuality>>('all')
  const [dynastyFilter, setDynastyFilter] = useState<FilterValue<DynastyId>>('all')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const ownedCards = useMemo(() => {
    return allCards
      .map((card) => ({ card, quantity: gameState.playerCards[card.id] || 0 }))
      .filter((item) => item.quantity > 0)
      .filter((item) => qualityFilter === 'all' || item.card.quality === qualityFilter)
      .filter((item) => dynastyFilter === 'all' || item.card.dynasty === dynastyFilter)
      .sort((a, b) => {
        if (b.card.level !== a.card.level) return b.card.level - a.card.level
        return a.card.name.localeCompare(b.card.name, 'zh-Hans-CN')
      })
  }, [allCards, dynastyFilter, gameState.playerCards, qualityFilter])

  const totalOwnedCopies = Object.values(gameState.playerCards).reduce((sum, count) => sum + count, 0)
  const uniqueOwnedCount = Object.keys(gameState.playerCards).filter((id) => gameState.playerCards[id] > 0).length
  const selectedQuantity = selectedCard ? gameState.playerCards[selectedCard.id] || 0 : 0

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">我的库存</p>
            <h1 className="screen-title">背包</h1>
            <p className="screen-subtitle">查看已持有卡牌与数量</p>
          </div>
          <Link href="/collection" className="atlas-chip">
            <span className="atlas-medal">册</span>
          </Link>
        </header>

        <section className="daily-scroll-panel">
          <div className="scroll-art flex items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-bronze/40 bg-jade/20 text-5xl font-black text-bronze">
              藏
            </div>
          </div>
          <div className="draw-counter">
            <div className="panel-label">
              <span />
              当前持有
              <b>!</b>
            </div>
            <div className="draw-count">
              <strong>{uniqueOwnedCount}</strong>
              <span>种</span>
            </div>
            <p>共 {totalOwnedCopies} 张卡牌</p>
            <div className="hero-actions">
              <Link href="/merge">去合成</Link>
              <Link href="/collection">去图鉴</Link>
            </div>
          </div>
          <div className="reset-seal">背包</div>
        </section>

        <section className="mt-4 space-y-3">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-bronze/70">稀有度筛选</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setQualityFilter('all')}
                className={`shrink-0 rounded-card px-3 py-1.5 text-xs font-bold ${
                  qualityFilter === 'all' ? 'bg-bronze text-ink' : 'border border-bronze/20 text-parchment/60'
                }`}
              >
                全部
              </button>
              {qualityEntries.map(([quality, meta]) => (
                <button
                  key={quality}
                  onClick={() => setQualityFilter(quality)}
                  className={`shrink-0 rounded-card px-3 py-1.5 text-xs font-bold ${
                    qualityFilter === quality ? 'bg-bronze text-ink' : 'border border-bronze/20 text-parchment/60'
                  }`}
                >
                  {meta.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-bronze/70">朝代筛选</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setDynastyFilter('all')}
                className={`shrink-0 rounded-card px-3 py-1.5 text-xs font-bold ${
                  dynastyFilter === 'all' ? 'bg-bronze text-ink' : 'border border-bronze/20 text-parchment/60'
                }`}
              >
                全部
              </button>
              {dynastyEntries.map(([dynasty, meta]) => (
                <button
                  key={dynasty}
                  onClick={() => setDynastyFilter(dynasty)}
                  className={`shrink-0 rounded-card px-3 py-1.5 text-xs font-bold ${
                    dynastyFilter === dynasty ? 'bg-bronze text-ink' : 'border border-bronze/20 text-parchment/60'
                  }`}
                >
                  {meta.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-bronze">持有卡牌</h2>
            <span className="text-xs text-parchment/45">{ownedCards.length} 种匹配</span>
          </div>

          {ownedCards.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {ownedCards.map(({ card, quantity }) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="relative text-left transition hover:opacity-85 active:scale-[0.98]"
                >
                  <CardDisplay
                    cardId={card.id}
                    cardName={card.name}
                    level={card.level}
                    quality={card.quality}
                    dynasty={card.dynasty}
                    image={card.image}
                    isRevealed
                  />
                  <span className="absolute right-1 top-1 rounded-full border border-gold/40 bg-black/75 px-2 py-0.5 text-[10px] font-black text-gold">
                    x{quantity}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bronze-panel py-12 text-center">
              <p className="text-4xl">🎴</p>
              <p className="mt-3 text-sm font-bold text-parchment/70">暂无匹配卡牌</p>
              <p className="mt-1 text-xs text-parchment/40">调整筛选条件，或先去抽卡获得新卡</p>
              <Link href="/draw" className="btn-primary-gold mt-4 inline-block">
                去抽卡
              </Link>
            </div>
          )}
        </section>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/merge" className="btn-primary-gold text-center">
            去合成
          </Link>
          <Link href="/collection" className="btn-secondary-dark text-center">
            去图鉴
          </Link>
        </div>
      </div>

      <InventoryCardDetailModal
        card={selectedCard}
        quantity={selectedQuantity}
        onClose={() => setSelectedCard(null)}
      />
    </PageLayout>
  )
}
