'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { useGame } from '@/lib/gameContext'
import { loadCards, getCardById } from '@/lib/cardUtils'
import { getRemainingDraws, getCollectionProgress } from '@/lib/storage'
import type { Card } from '@/lib/types'

export default function HomePage() {
  const { gameState } = useGame()
  const [ultimateCards, setUltimateCards] = useState<Card[]>([])
  const [collectionProgress, setCollectionProgress] = useState({ unlocked: 0, total: 0 })
  const [recommendedMerge, setRecommendedMerge] = useState<string>('')

  useEffect(() => {
    const allCards = loadCards()

    // 获取终极卡（level 5）
    const level5Cards = allCards.filter((c) => c.level === 5)
    const playerUltimateCards = level5Cards.filter((c) => gameState.unlockedCards.includes(c.id))
    setUltimateCards(playerUltimateCards)

    // 计算图鉴完成度
    const progress = getCollectionProgress(gameState, allCards)
    setCollectionProgress(progress)

    // 推荐合成路线：找第一个玩家可以合成的卡
    const canCompose = allCards.filter((c) => c.level <= 2 && gameState.unlockedCards.includes(c.id))
    if (canCompose.length >= 2) {
      setRecommendedMerge('下一个可合成的卡在合成页中查看')
    }
  }, [gameState])

  const remainingDraws = getRemainingDraws(gameState)

  return (
    <PageLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-bronze mb-2">国风炼金卡牌</h1>
          <p className="text-paper/60 text-sm">收集历史人物，炼金融合，探索楚汉传奇</p>
        </div>

        {/* 每日抽卡进度 */}
        <div className="card-frame p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-bronze">每日抽卡</h2>
            <span className="text-2xl font-bold text-jade">{remainingDraws}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill transition-all duration-500"
              style={{ width: `${((20 - remainingDraws) / 20) * 100}%` }}
            />
          </div>
          <p className="text-xs text-paper/60">今日已抽 {20 - remainingDraws} / 20 张</p>
          <Link href="/draw" className="btn-primary w-full text-center block mt-3">
            立即抽卡
          </Link>
        </div>

        {/* 图鉴完成度 */}
        <div className="card-frame p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-bronze">图鉴完成度</h2>
            <span className="text-2xl font-bold text-jade">
              {collectionProgress.unlocked}/{collectionProgress.total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill transition-all duration-500"
              style={{
                width: `${(collectionProgress.unlocked / collectionProgress.total) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-paper/60">
            已收集 {Math.round((collectionProgress.unlocked / collectionProgress.total) * 100)}%
          </p>
          <Link href="/collection" className="btn-secondary w-full text-center block">
            查看图鉴
          </Link>
        </div>

        {/* 拥有的终极卡 */}
        {ultimateCards.length > 0 && (
          <div className="card-frame p-4 space-y-3">
            <h2 className="text-lg font-bold text-bronze">传说卡收集</h2>
            <div className="grid grid-cols-1 gap-2">
              {ultimateCards.map((card) => (
                <div key={card.id} className="flex items-center gap-3 p-2 bg-ink/30 rounded">
                  <span className="text-2xl">⭐</span>
                  <div className="flex-1">
                    <p className="font-bold text-bronze">{card.name}</p>
                    <p className="text-xs text-paper/60">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 推荐合成 */}
        <div className="card-frame p-4 space-y-3">
          <h2 className="text-lg font-bold text-bronze">合成建议</h2>
          <p className="text-sm text-paper/70">{recommendedMerge || '收集更多卡片以解锁合成方案'}</p>
          <Link href="/merge" className="btn-primary w-full text-center block mt-3">
            进入合成
          </Link>
        </div>

        {/* 每日任务 */}
        <div className="card-frame p-4 space-y-3">
          <h2 className="text-lg font-bold text-bronze">每日任务</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-jade/10 rounded">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-paper">完成3次抽卡</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-jade/10 rounded">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-paper">进行1次卡牌合成</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-jade/10 rounded">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-paper">查看5张新卡片</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
