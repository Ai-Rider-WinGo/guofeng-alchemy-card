'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { drawFromPool, getCardById } from '@/lib/cardUtils'
import { getRemainingDraws, addCardToInventory, calculateStars } from '@/lib/storage'
import type { Card } from '@/lib/types'
import { DUPLICATION_FOR_STAR } from '@/lib/types'

interface DrawResult {
  cardId: string
  card: Card
  isNew: boolean
  starCount: number
}

export default function DrawPage() {
  const { gameState, updateGameState } = useGame()
  const [drawResults, setDrawResults] = useState<DrawResult[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const remainingDraws = getRemainingDraws(gameState)
  const selectedResult = drawResults[selectedIndex]

  const drawCards = async (count: number) => {
    if (remainingDraws < count || isDrawing) return

    setIsDrawing(true)
    setDrawResults([])
    setSelectedIndex(0)
    await new Promise((resolve) => setTimeout(resolve, count === 1 ? 360 : 560))

    const results: DrawResult[] = []
    let newState = gameState

    for (let i = 0; i < count; i++) {
      const cardId = drawFromPool('permanent_basic')
      if (!cardId) continue

      const card = getCardById(cardId)
      if (!card) continue

      const isNew = !newState.unlockedCards.includes(cardId)
      const currentCount = (newState.playerCards[cardId] || 0) + 1

      results.push({
        cardId,
        card,
        isNew,
        starCount: calculateStars(currentCount, DUPLICATION_FOR_STAR),
      })

      newState = addCardToInventory(newState, cardId)
    }

    updateGameState({
      ...newState,
      dailyDrawCount: newState.dailyDrawCount + count,
    })

    setDrawResults(results)
    setIsDrawing(false)
  }

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">楚汉卡池</p>
            <h1 className="screen-title">今日抽卡</h1>
            <p className="screen-subtitle">炉烟起，卡牌显。先验证秦汉之际的收集闭环。</p>
          </div>
          <Link href="/" className="ghost-button shrink-0 px-3 py-2">
            首页
          </Link>
        </header>

        <section className="parchment-strip grid grid-cols-[42%_1fr] gap-4">
          <div className="relative min-h-[185px]">
            <img className="absolute bottom-0 left-[-24px] w-[190px] max-w-none" src="/ui/reference-cauldron.png" alt="炼金炉鼎" />
            <img className="absolute bottom-8 left-[-26px] w-24 opacity-70 mix-blend-screen" src="/ui/reference-smoke.png" alt="" aria-hidden="true" />
          </div>

          <div className="relative z-10 flex flex-col justify-center text-center">
            <p className="text-sm font-black tracking-[0.12em]">本日余量</p>
            <div className="my-3 border-y border-ink/15 py-2">
              <strong className="block text-[58px] leading-none">{remainingDraws}</strong>
              <span className="text-sm font-bold text-ink/60">/ 20 次</span>
            </div>
            <p className="text-xs font-bold text-ink/60">23:59:59 后重置</p>
          </div>
        </section>

        <section className="bronze-panel mt-4 p-4">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.28em] text-bronze/70">PERIOD POOL</p>
              <h2 className="mt-1 text-xl font-black text-parchment">秦汉之际 · 楚汉战争</h2>
            </div>
            <div className="rounded-full border border-bronze/30 px-3 py-1 text-xs font-bold text-bronze">
              保底 26
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            <CardDisplay cardId="liubang_002" cardName="刘邦" level={2} rarity="rare" />
            <CardDisplay cardId="xiangyu_002" cardName="项羽" level={2} rarity="rare" />
            <CardDisplay cardId="xingyang_escape_004" cardName="荥阳脱困" level={4} rarity="epic" />
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
            <button className="ritual-button" disabled={remainingDraws < 1 || isDrawing} onClick={() => drawCards(1)}>
              {isDrawing ? '炉火翻涌' : '抽 1 次'}
            </button>
            <button className="ritual-button" disabled={remainingDraws < 10 || isDrawing} onClick={() => drawCards(10)}>
              {isDrawing ? '炉火翻涌' : '抽 10 次'}
            </button>
          </div>
        </section>

        <section className="bronze-panel mt-4 p-4">
          <div className="relative z-10">
            <div className="ornate-title compact">
              <span />
              抽卡结果
              <span />
            </div>

            {drawResults.length === 0 ? (
              <div className="mt-5 rounded-md border border-bronze/20 bg-black/20 p-5 text-center">
                <p className="text-sm font-bold text-parchment">卡牌尚未显现</p>
                <p className="mt-2 text-xs leading-5 text-parchment/55">点击抽卡后，结果会在此处以卡册样式展开。</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="mx-auto max-w-[190px]">
                  <CardDisplay
                    cardId={selectedResult.cardId}
                    cardName={selectedResult.card.name}
                    level={selectedResult.card.level}
                    rarity={selectedResult.card.rarity}
                  />
                </div>

                <div className="parchment-strip p-3 text-center">
                  <p className="text-lg font-black">{selectedResult.card.name}</p>
                  <p className="mt-1 text-xs font-bold text-ink/60">
                    {selectedResult.isNew ? '新卡入册' : `重复卡 · 已成 ${selectedResult.starCount} 星`}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink/68">{selectedResult.card.description}</p>
                </div>

                {drawResults.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {drawResults.map((result, index) => (
                      <button
                        key={`${result.cardId}-${index}`}
                        onClick={() => setSelectedIndex(index)}
                        className={`rounded-sm border p-1 transition ${
                          selectedIndex === index ? 'border-bronze bg-bronze/10' : 'border-bronze/20 bg-black/20'
                        }`}
                      >
                        <CardDisplay
                          cardId={result.cardId}
                          cardName={result.card.name}
                          level={result.card.level}
                          rarity={result.card.rarity}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
