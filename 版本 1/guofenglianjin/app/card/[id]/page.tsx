'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { getCardById, loadCards } from '@/lib/cardUtils'
import type { Card } from '@/lib/types'

const typeLabels: Record<string, string> = {
  person: '人物',
  event: '事件',
  strategy: '谋略',
  place: '地名',
}

export default function CardDetailPage() {
  const { gameState } = useGame()
  const params = useParams()
  const cardId = params.id as string
  const [card, setCard] = useState<Card | null>(null)
  const [relatedCards, setRelatedCards] = useState<Card[]>([])

  useEffect(() => {
    const foundCard = getCardById(cardId)
    if (!foundCard) return

    setCard(foundCard)
    const allCards = loadCards()
    setRelatedCards(
      foundCard.relatedCards
        .map((id) => allCards.find((item) => item.id === id))
        .filter((item): item is Card => item !== undefined)
    )
  }, [cardId])

  if (!card) {
    return (
      <PageLayout>
        <div className="screen-shell">
          <section className="bronze-panel p-8 text-center">
            <p className="relative z-10 text-sm text-parchment/60">卡片未找到</p>
            <Link href="/collection" className="ghost-button relative z-10 mt-4 block">
              返回图鉴
            </Link>
          </section>
        </div>
      </PageLayout>
    )
  }

  const isUnlocked = gameState.unlockedCards.includes(cardId)

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">{card.dynasty}</p>
            <h1 className="screen-title">{card.name}</h1>
            <p className="screen-subtitle">{card.description}</p>
          </div>
          <Link href="/collection" className="ghost-button shrink-0 px-3 py-2">
            图鉴
          </Link>
        </header>

        <section className="bronze-panel p-4">
          <div className="relative z-10 grid grid-cols-[44%_1fr] gap-4">
            <CardDisplay
              cardId={card.id}
              cardName={isUnlocked ? card.name : '未解锁'}
              level={card.level}
              rarity={card.rarity}
              isRevealed={isUnlocked}
            />

            <div className="space-y-3">
              {[
                ['等级', String(card.level)],
                ['稀有度', card.rarity],
                ['类型', typeLabels[card.type] ?? card.type],
                ['持有', isUnlocked ? `${gameState.playerCards[cardId] || 1} 张` : '未收集'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-sm border border-bronze/20 bg-black/20 px-3 py-2">
                  <p className="text-[11px] font-bold text-parchment/45">{label}</p>
                  <p className="mt-1 text-sm font-black text-bronze">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-3">
          <div className="parchment-strip">
            <p className="text-sm font-black tracking-[0.18em]">历史故事</p>
            <p className="mt-2 text-xs leading-6 text-ink/72">{card.story}</p>
          </div>

          <div className="bronze-panel p-4">
            <div className="relative z-10 space-y-4">
              <div>
                <p className="text-sm font-black text-bronze">历史知识点</p>
                <p className="mt-2 text-xs leading-6 text-parchment/68">{card.knowledgePoint}</p>
              </div>
              <div className="h-px bg-bronze/20" />
              <div>
                <p className="text-sm font-black text-bronze">合成提示</p>
                <p className="mt-2 text-xs leading-6 text-parchment/68">{card.mergeHint}</p>
              </div>
            </div>
          </div>
        </section>

        {relatedCards.length > 0 && (
          <section className="mt-5">
            <div className="ornate-title compact">
              <span />
              相关卡片
              <span />
            </div>
            <div className="route-frame">
              {relatedCards.map((relatedCard) => (
                <Link key={relatedCard.id} href={`/card/${relatedCard.id}`} className="min-w-[72px]">
                  <CardDisplay
                    cardId={relatedCard.id}
                    cardName={relatedCard.name}
                    level={relatedCard.level}
                    rarity={relatedCard.rarity}
                    isRevealed={gameState.unlockedCards.includes(relatedCard.id)}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/collection" className="ghost-button text-center">
            返回图鉴
          </Link>
          {card.level <= 2 ? (
            <Link href="/merge" className="ritual-button text-center">
              用于合成
            </Link>
          ) : (
            <Link href="/draw" className="ritual-button text-center">
              前往抽卡
            </Link>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
