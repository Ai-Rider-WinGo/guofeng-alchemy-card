'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { getCardById, loadCards } from '@/lib/cardUtils'
import type { Card } from '@/lib/types'

export default function CardDetailPage() {
  const { gameState } = useGame()
  const params = useParams()
  const cardId = params.id as string
  const [card, setCard] = useState<Card | null>(null)
  const [relatedCards, setRelatedCards] = useState<Card[]>([])

  useEffect(() => {
    const foundCard = getCardById(cardId)
    if (foundCard) {
      setCard(foundCard)

      const allCards = loadCards()
      const related = foundCard.relatedCards
        .map((id) => allCards.find((c) => c.id === id))
        .filter((c): c is Card => c !== undefined)
      setRelatedCards(related)
    }
  }, [cardId])

  if (!card) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          <p className="text-paper/60">卡片未找到</p>
          <Link href="/collection" className="btn-secondary block mt-4">
            返回图鉴
          </Link>
        </div>
      </PageLayout>
    )
  }

  const isUnlocked = gameState.unlockedCards.includes(cardId)

  return (
    <PageLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 卡牌大图 */}
        <div className="flex justify-center">
          {isUnlocked ? (
            <div className="w-56">
              <CardDisplay
                cardId={card.id}
                cardName={card.name}
                level={card.level}
                quality={card.quality}
                isRevealed
              />
            </div>
          ) : (
            <div className="card-frame w-56 aspect-[2/3] border-2 border-bronze/20 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">❓</div>
                <p className="text-paper/60">未解锁的卡片</p>
              </div>
            </div>
          )}
        </div>

        {/* 卡片属性 */}
        <div className="card-frame p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-bronze mb-1">{card.name}</h1>
            <p className="text-sm text-paper/60">{card.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-ink/30 rounded">
              <p className="text-paper/60 text-xs">等级</p>
              <p className="text-lg font-bold text-bronze">{card.level}</p>
            </div>
            <div className="p-2 bg-ink/30 rounded">
              <p className="text-paper/60 text-xs">稀有度</p>
              <p className="text-lg font-bold text-bronze">{card.quality}</p>
            </div>
            <div className="p-2 bg-ink/30 rounded">
              <p className="text-paper/60 text-xs">朝代</p>
              <p className="text-lg font-bold text-bronze">{card.dynasty}</p>
            </div>
            <div className="p-2 bg-ink/30 rounded">
              <p className="text-paper/60 text-xs">类型</p>
              <p className="text-lg font-bold text-bronze">
                {card.type === 'person' ? '人物' : card.type === 'event' ? '事件' : '战略'}
              </p>
            </div>
          </div>
        </div>

        {/* 历史故事 */}
        <div className="card-frame p-4 space-y-2">
          <h2 className="text-lg font-bold text-bronze">历史故事</h2>
          <p className="text-sm text-paper/70 leading-relaxed">{card.story}</p>
        </div>

        {/* 历史知识点 */}
        <div className="card-frame p-4 space-y-2">
          <h2 className="text-lg font-bold text-bronze">历史知识点</h2>
          <p className="text-sm text-paper/70 leading-relaxed">{card.knowledgePoint}</p>
        </div>

        {/* 合成提示 */}
        <div className="card-frame p-4 space-y-2">
          <h2 className="text-lg font-bold text-jade">合成提示</h2>
          <p className="text-sm text-paper/70 leading-relaxed">{card.mergeHint}</p>
        </div>

        {/* 相关卡片 */}
        {relatedCards.length > 0 && (
          <div className="card-frame p-4 space-y-3">
            <h2 className="text-lg font-bold text-bronze">相关卡片</h2>
            <div className="grid grid-cols-3 gap-2">
              {relatedCards.map((relatedCard) => (
                <Link
                  key={relatedCard.id}
                  href={`/card/${relatedCard.id}`}
                  className="hover:opacity-80 transition"
                >
                  <CardDisplay
                    cardId={relatedCard.id}
                    cardName={relatedCard.name}
                    level={relatedCard.level}
                    quality={relatedCard.quality}
                    isRevealed={gameState.unlockedCards.includes(relatedCard.id)}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 拥有状态 */}
        {isUnlocked && (
          <div className="card-frame p-4 text-center bg-jade/10 border-jade/30">
            <p className="text-sm text-jade">✓ 已收集</p>
            <p className="text-xs text-paper/60 mt-1">拥有 {gameState.playerCards[cardId] || 1} 张</p>
          </div>
        )}

        {/* 导航 */}
        <div className="flex gap-3">
          <Link href="/collection" className="btn-secondary flex-1 text-center">
            返回图鉴
          </Link>
          {card.level <= 2 && (
            <Link href="/merge" className="btn-primary flex-1 text-center">
              用于合成
            </Link>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
