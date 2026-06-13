'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { drawFromPool, getCardById, loadCards } from '@/lib/cardUtils'
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const remainingDraws = getRemainingDraws(gameState)

  const handleSingleDraw = async () => {
    if (remainingDraws === 0) return

    setIsDrawing(true)
    setSelectedIndex(null)
    setDrawResults([])

    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    const cardId = drawFromPool('permanent_basic')
    if (!cardId) return

    const card = getCardById(cardId)
    if (!card) return

    const isNew = !gameState.unlockedCards.includes(cardId)
    const currentCount = (gameState.playerCards[cardId] || 0) + 1
    const starCount = calculateStars(currentCount, DUPLICATION_FOR_STAR)

    const result: DrawResult = {
      cardId,
      card,
      isNew,
      starCount,
    }

    setDrawResults([result])
    setSelectedIndex(0)

    // 更新游戏状态
    let newState = addCardToInventory(gameState, cardId)
    newState = {
      ...newState,
      dailyDrawCount: newState.dailyDrawCount + 1,
    }
    updateGameState(newState)

    setIsDrawing(false)
  }

  const handleTenDraw = async () => {
    if (remainingDraws < 10) return

    setIsDrawing(true)
    setSelectedIndex(null)
    setDrawResults([])

    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    const results: DrawResult[] = []
    let newState = gameState

    for (let i = 0; i < 10; i++) {
      const cardId = drawFromPool('permanent_basic')
      if (!cardId) continue

      const card = getCardById(cardId)
      if (!card) continue

      const isNew = !newState.unlockedCards.includes(cardId)
      const currentCount = (newState.playerCards[cardId] || 0) + 1
      const starCount = calculateStars(currentCount, DUPLICATION_FOR_STAR)

      results.push({
        cardId,
        card,
        isNew,
        starCount,
      })

      newState = addCardToInventory(newState, cardId)
    }

    setDrawResults(results)

    // 更新游戏状态
    newState = {
      ...newState,
      dailyDrawCount: newState.dailyDrawCount + 10,
    }
    updateGameState(newState)

    setIsDrawing(false)
  }

  const handleContinue = () => {
    setDrawResults([])
    setSelectedIndex(null)
  }

  if (drawResults.length > 0) {
    if (selectedIndex === null && !isDrawing) {
      return (
        <PageLayout>
          <div className="max-w-md mx-auto px-4 py-6 space-y-6">
            <h1 className="text-2xl font-bold text-bronze text-center">抽卡结果</h1>

            {drawResults.length === 1 ? (
              // 单抽显示
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-48">
                    <CardDisplay
                      cardId={drawResults[0].cardId}
                      cardName={drawResults[0].card.name}
                      level={drawResults[0].card.level}
                      rarity={drawResults[0].card.rarity}
                      isRevealed
                    />
                  </div>
                </div>

                <div className="card-frame p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-paper/70">卡牌等级</span>
                    <span className="text-lg font-bold text-bronze">{drawResults[0].card.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-paper/70">稀有度</span>
                    <span className="text-lg font-bold text-bronze">{drawResults[0].card.rarity}</span>
                  </div>
                  {drawResults[0].isNew ? (
                    <div className="p-2 bg-jade/20 rounded text-center">
                      <span className="text-jade font-bold">✨ 新卡 ✨</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-bronze/20 rounded text-center space-y-1">
                      <span className="text-bronze font-bold block">重复卡</span>
                      <span className="text-xs text-paper/60">
                        已拥有 {drawResults[0].starCount} ⭐
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-paper/70 mt-3">{drawResults[0].card.description}</p>
                </div>
              </div>
            ) : (
              // 十连显示
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {drawResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className="transition-transform hover:scale-105"
                    >
                      <CardDisplay
                        cardId={result.cardId}
                        cardName={result.card.name}
                        level={result.card.level}
                        rarity={result.card.rarity}
                        isRevealed
                      />
                    </button>
                  ))}
                </div>

                {selectedIndex !== null && (
                  <div className="card-frame p-4 space-y-2">
                    <h2 className="text-lg font-bold text-bronze">{drawResults[selectedIndex].card.name}</h2>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-paper/70">等级 {drawResults[selectedIndex].card.level}</span>
                      <span className="text-paper/70">{drawResults[selectedIndex].card.rarity}</span>
                    </div>
                    {drawResults[selectedIndex].isNew ? (
                      <span className="inline-block text-jade font-bold">✨ 新卡</span>
                    ) : (
                      <span className="inline-block text-bronze font-bold">重复 ({drawResults[selectedIndex].starCount}⭐)</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleContinue} className="btn-secondary flex-1">
                查看其他结果
              </button>
              <Link href="/" className="btn-primary flex-1 text-center">
                返回首页
              </Link>
            </div>
          </div>
        </PageLayout>
      )
    }
  }

  return (
    <PageLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-bronze mb-2">命运之卡</h1>
          <p className="text-paper/60 text-sm">探寻历史中的传奇人物</p>
        </div>

        {/* 剩余次数 */}
        <div className="card-frame p-6 text-center space-y-2">
          <p className="text-paper/60 text-sm">今日剩余抽卡次数</p>
          <p className="text-5xl font-bold text-jade">{remainingDraws}</p>
          <p className="text-paper/60 text-xs">最多每日抽卡 20 次</p>
        </div>

        {/* 抽卡按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleSingleDraw}
            disabled={remainingDraws === 0 || isDrawing}
            className={`w-full py-4 rounded-card font-bold transition-all ${
              remainingDraws === 0
                ? 'bg-paper/20 text-paper/40 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isDrawing ? '抽卡中...' : '单抽'}
          </button>

          <button
            onClick={handleTenDraw}
            disabled={remainingDraws < 10 || isDrawing}
            className={`w-full py-4 rounded-card font-bold transition-all ${
              remainingDraws < 10
                ? 'bg-paper/20 text-paper/40 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isDrawing ? '抽卡中...' : '十连抽'}
          </button>
        </div>

        {/* 提示信息 */}
        <div className="card-frame p-4 space-y-2">
          <h3 className="font-bold text-bronze text-sm">同名升星</h3>
          <p className="text-xs text-paper/70">
            拥有 3 张相同的卡片可以升一个星级，获得更强的属性。同名卡片重复获取时会自动累计。
          </p>
        </div>

        <Link href="/" className="btn-secondary w-full text-center">
          返回首页
        </Link>
      </div>
    </PageLayout>
  )
}
