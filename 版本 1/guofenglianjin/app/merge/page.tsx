'use client'

import { useState, useEffect } from 'react'
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
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const cards = loadCards()
    setAllCards(cards)
  }, [])

  const playerCardList = allCards.filter((card) => (gameState.playerCards[card.id] || 0) > 0)

  const handleSelectCard = (cardId: string, isSecond: boolean) => {
    if (isSecond) {
      setSelectedCard2(cardId)
    } else {
      setSelectedCard1(cardId)
    }
    setMergeResult(null)
  }

  const handleCheckMerge = () => {
    if (!selectedCard1 || !selectedCard2) return

    const rule = canMerge(selectedCard1, selectedCard2)
    if (!rule) {
      setMergeResult(null)
      return
    }

    const resultCard = getCardById(rule.to)
    if (!resultCard) return

    setMergeResult({ rule, resultCard })
  }

  const handleExecuteMerge = async () => {
    if (!selectedCard1 || !selectedCard2 || !mergeResult) return

    let newState = removeCardFromInventory(gameState, selectedCard1, 1)
    newState = removeCardFromInventory(newState, selectedCard2, 1)
    newState = addCardToInventory(newState, mergeResult.resultCard.id)

    updateGameState(newState)

    // 重置状态
    setSelectedCard1(null)
    setSelectedCard2(null)
    setMergeResult(null)
    setShowConfirm(false)
  }

  return (
    <PageLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-bronze mb-2">炼金合成</h1>
          <p className="text-paper/60 text-sm">融合两张历史卡片，创造更高阶的事件</p>
        </div>

        {/* 第一张卡选择 */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-bronze">选择第一张卡片</label>
          {selectedCard1 && getCardById(selectedCard1) && (
            <div className="flex gap-4">
              <div className="w-24">
                <CardDisplay
                  cardId={selectedCard1}
                  cardName={getCardById(selectedCard1)!.name}
                  level={getCardById(selectedCard1)!.level}
                  rarity={getCardById(selectedCard1)!.rarity}
                  isRevealed
                />
              </div>
              <button
                onClick={() => setSelectedCard1(null)}
                className="btn-secondary self-start"
              >
                更换
              </button>
            </div>
          )}

          {!selectedCard1 && (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {playerCardList.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSelectCard(card.id, false)}
                  className="hover:opacity-80 transition"
                >
                  <CardDisplay
                    cardId={card.id}
                    cardName={card.name}
                    level={card.level}
                    rarity={card.rarity}
                    isRevealed
                  />
                  <p className="text-xs text-paper/60 mt-1">拥有 {gameState.playerCards[card.id]}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 加号 */}
        {selectedCard1 && (
          <div className="flex justify-center">
            <div className="text-3xl text-bronze font-bold">+</div>
          </div>
        )}

        {/* 第二张卡选择 */}
        {selectedCard1 && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-bronze">选择第二张卡片</label>
            {selectedCard2 && getCardById(selectedCard2) && (
              <div className="flex gap-4">
                <div className="w-24">
                  <CardDisplay
                    cardId={selectedCard2}
                    cardName={getCardById(selectedCard2)!.name}
                    level={getCardById(selectedCard2)!.level}
                    rarity={getCardById(selectedCard2)!.rarity}
                    isRevealed
                  />
                </div>
                <button
                  onClick={() => setSelectedCard2(null)}
                  className="btn-secondary self-start"
                >
                  更换
                </button>
              </div>
            )}

            {!selectedCard2 && (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {playerCardList
                  .filter((c) => c.id !== selectedCard1)
                  .map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card.id, true)}
                      className="hover:opacity-80 transition"
                    >
                      <CardDisplay
                        cardId={card.id}
                        cardName={card.name}
                        level={card.level}
                        rarity={card.rarity}
                        isRevealed
                      />
                      <p className="text-xs text-paper/60 mt-1">拥有 {gameState.playerCards[card.id]}</p>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 合成预览 */}
        {selectedCard1 && selectedCard2 && !mergeResult && (
          <button onClick={handleCheckMerge} className="btn-primary w-full">
            检查合成
          </button>
        )}

        {mergeResult && (
          <div className="card-frame p-4 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-jade mb-2">✨ 合成成功 ✨</h2>
              <div className="flex items-center justify-between mb-3">
                <div className="w-16">
                  <CardDisplay
                    cardId={selectedCard1!}
                    cardName={getCardById(selectedCard1!)!.name}
                    level={getCardById(selectedCard1!)!.level}
                    rarity={getCardById(selectedCard1!)!.rarity}
                    isRevealed
                  />
                </div>
                <span className="text-2xl text-bronze">➜</span>
                <div className="w-16">
                  <CardDisplay
                    cardId={mergeResult.resultCard.id}
                    cardName={mergeResult.resultCard.name}
                    level={mergeResult.resultCard.level}
                    rarity={mergeResult.resultCard.rarity}
                    isRevealed
                  />
                </div>
              </div>
            </div>

            <div className="bg-ink/30 p-3 rounded space-y-2">
              <p className="text-sm font-bold text-bronze">历史渊源</p>
              <p className="text-xs text-paper/70 leading-relaxed">{mergeResult.rule.mergeDesc}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-bronze">结果卡片</p>
              <div className="bg-ink/30 p-3 rounded">
                <p className="text-paper font-bold">{mergeResult.resultCard.name}</p>
                <p className="text-xs text-paper/60 mt-1">{mergeResult.resultCard.description}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMergeResult(null)
                  setSelectedCard1(null)
                  setSelectedCard2(null)
                }}
                className="btn-secondary flex-1"
              >
                重新选择
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="btn-primary flex-1"
              >
                确认合成
              </button>
            </div>
          </div>
        )}

        {mergeResult === null && selectedCard1 && selectedCard2 && (
          <div className="card-frame p-4 text-center">
            <p className="text-paper/70 text-sm">这两张卡片无法合成</p>
            <p className="text-xs text-paper/60 mt-2">尝试其他卡片组合</p>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 p-4 safe-area-inset">
            <div className="card-frame p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-bold text-bronze">确认合成？</h3>
              <p className="text-sm text-paper/70">
                消耗 {getCardById(selectedCard1!)?.name} 和 {getCardById(selectedCard2!)?.name}，获得 {mergeResult?.resultCard.name}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleExecuteMerge}
                  className="btn-primary flex-1"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        <Link href="/" className="btn-secondary w-full text-center block">
          返回首页
        </Link>
      </div>
    </PageLayout>
  )
}
