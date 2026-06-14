'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { loadCards, canMerge, getCardById } from '@/lib/cardUtils'
import { removeCardFromInventory, addCardToInventory } from '@/lib/storage'
import type { Card } from '@/lib/types'

export default function MergePage() {
  const { gameState, updateGameState } = useGame()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [selectedCard1, setSelectedCard1] = useState<string | null>(null)
  const [selectedCard2, setSelectedCard2] = useState<string | null>(null)
  const [mergeResult, setMergeResult] = useState<{ rule: any; resultCard: Card } | null>(null)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    setAllCards(loadCards())
  }, [])

  const playerCardList = allCards.filter((card) => (gameState.playerCards[card.id] || 0) > 0)
  const firstCard = selectedCard1 ? getCardById(selectedCard1) : null
  const secondCard = selectedCard2 ? getCardById(selectedCard2) : null

  const selectCard = (cardId: string) => {
    if (!selectedCard1 || (selectedCard1 && selectedCard2)) {
      setSelectedCard1(cardId)
      setSelectedCard2(null)
    } else if (selectedCard1 !== cardId) {
      setSelectedCard2(cardId)
    }
    setMergeResult(null)
    setHasChecked(false)
  }

  const checkMerge = () => {
    if (!selectedCard1 || !selectedCard2) return
    const rule = canMerge(selectedCard1, selectedCard2)
    const resultCard = rule ? getCardById(rule.to) : null
    setMergeResult(rule && resultCard ? { rule, resultCard } : null)
    setHasChecked(true)
  }

  const executeMerge = () => {
    if (!selectedCard1 || !selectedCard2 || !mergeResult) return

    let newState = removeCardFromInventory(gameState, selectedCard1, 1)
    newState = removeCardFromInventory(newState, selectedCard2, 1)
    newState = addCardToInventory(newState, mergeResult.resultCard.id)

    updateGameState(newState)
    setSelectedCard1(null)
    setSelectedCard2(null)
    setMergeResult(null)
    setHasChecked(false)
  }

  const slotClass = 'min-h-[178px] rounded-[8px] border border-bronze/25 bg-black/25 p-2'

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">关系合成</p>
            <h1 className="screen-title">英雄进阶</h1>
            <p className="screen-subtitle">选择两张历史卡，验证人物与事件之间的关系链。</p>
          </div>
          <Link href="/" className="ghost-button shrink-0 px-3 py-2">
            首页
          </Link>
        </header>

        <section className="bronze-panel p-4">
          <div className="relative z-10 grid grid-cols-[1fr_62px_1fr] items-center gap-3">
            <button className={slotClass} onClick={() => setSelectedCard1(null)}>
              {firstCard ? (
                <CardDisplay cardId={firstCard.id} cardName={firstCard.name} level={firstCard.level} rarity={firstCard.rarity} />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs font-bold leading-5 text-parchment/50">
                  选择第一张
                </div>
              )}
            </button>

            <div className="relative flex flex-col items-center gap-2">
              <img className="w-16 opacity-90" src="/ui/reference-cauldron.png" alt="合成炉鼎" />
              <span className="rounded-full border border-bronze/35 bg-black/35 px-2 py-1 text-xs font-bold text-bronze">合</span>
            </div>

            <button className={slotClass} onClick={() => setSelectedCard2(null)}>
              {secondCard ? (
                <CardDisplay cardId={secondCard.id} cardName={secondCard.name} level={secondCard.level} rarity={secondCard.rarity} />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs font-bold leading-5 text-parchment/50">
                  选择第二张
                </div>
              )}
            </button>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
            <button className="ghost-button" onClick={() => {
              setSelectedCard1(null)
              setSelectedCard2(null)
              setMergeResult(null)
              setHasChecked(false)
            }}>
              清空卡槽
            </button>
            <button className="ritual-button" disabled={!selectedCard1 || !selectedCard2} onClick={checkMerge}>
              检查关系
            </button>
          </div>
        </section>

        <section className="mt-4">
          <div className="ornate-title compact">
            <span />
            库存卡牌
            <span />
          </div>

          <div className="route-frame">
            {playerCardList.length === 0 ? (
              <div className="w-full py-8 text-center text-sm text-parchment/55">
                尚未拥有可合成卡牌，先前往抽卡。
              </div>
            ) : (
              playerCardList.map((card) => (
                <button
                  key={card.id}
                  onClick={() => selectCard(card.id)}
                  className={`min-w-[72px] rounded-sm border p-1 transition ${
                    selectedCard1 === card.id || selectedCard2 === card.id
                      ? 'border-bronze bg-bronze/10'
                      : 'border-bronze/20 bg-black/20'
                  }`}
                >
                  <CardDisplay cardId={card.id} cardName={card.name} level={card.level} rarity={card.rarity} />
                  <p className="mt-1 text-xs font-bold text-bronze/80">持有 {gameState.playerCards[card.id]}</p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="bronze-panel mt-4 p-4">
          <div className="relative z-10">
            <div className="ornate-title compact">
              <span />
              合成预览
              <span />
            </div>

            {!hasChecked ? (
              <p className="mt-4 rounded-md border border-bronze/20 bg-black/20 p-4 text-center text-sm leading-6 text-parchment/60">
                选择两张卡后检查历史关系，系统会展示可合成事件与说明。
              </p>
            ) : mergeResult ? (
              <div className="mt-4 space-y-4">
                <div className="mx-auto max-w-[160px]">
                  <CardDisplay
                    cardId={mergeResult.resultCard.id}
                    cardName={mergeResult.resultCard.name}
                    level={mergeResult.resultCard.level}
                    rarity={mergeResult.resultCard.rarity}
                  />
                </div>
                <div className="parchment-strip p-3">
                  <p className="text-center text-lg font-black">{mergeResult.resultCard.name}</p>
                  <p className="mt-2 text-xs leading-5 text-ink/70">{mergeResult.rule.mergeDesc}</p>
                </div>
                <button className="ritual-button w-full" onClick={executeMerge}>
                  确认合成
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-md border border-bronze/20 bg-black/20 p-4 text-center text-sm leading-6 text-parchment/60">
                这组卡暂未形成合成路线，换一张试试。
              </p>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
