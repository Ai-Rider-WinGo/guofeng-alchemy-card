'use client'

import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { loadCards } from '@/lib/cardUtils'

export default function GalleryPage() {
  const { gameState } = useGame()
  const allCards = loadCards()

  // 获取玩家拥有的 Lv4+ 卡牌（展示柜）
  const showcaseCards = allCards
    .filter(c => (gameState.playerCards[c.id] || 0) > 0 && c.level >= 4)
    .slice(0, 6)

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">我的珍藏</p>
            <h1 className="screen-title">炼金阁</h1>
            <p className="screen-subtitle">展示你的收藏成就</p>
          </div>
        </header>

        {/* 展示柜 */}
        <div className="bronze-panel p-4 mb-4">
          <h3 className="text-sm font-bold text-bronze mb-3">🖼️ 展示柜</h3>
          {showcaseCards.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {showcaseCards.map((card) => (
                <div key={card.id} className="w-full">
                  <CardDisplay
                    cardId={card.id}
                    cardName={card.name}
                    level={card.level}
                    quality={card.quality}
                    isRevealed
                  />
                </div>
              ))}
              {/* 空位 */}
              {Array.from({ length: Math.max(0, 6 - showcaseCards.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-full aspect-[2/3] border-2 border-dashed border-parchment/10 rounded-card flex items-center justify-center"
                >
                  <span className="text-2xl text-parchment/20">+</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🏛️</p>
              <p className="text-sm text-parchment/50">收集 Lv4+ 卡牌后在此展示</p>
            </div>
          )}
        </div>

        {/* 统计 */}
        <div className="bronze-panel p-4 mb-4">
          <h3 className="text-sm font-bold text-bronze mb-3">📊 收藏统计</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-black text-bronze">{gameState.unlockedCards.length}</p>
              <p className="text-xs text-parchment/50">已收集卡牌</p>
            </div>
            <div>
              <p className="text-2xl font-black text-bronze">{gameState.totalMerges}</p>
              <p className="text-xs text-parchment/50">累计合成</p>
            </div>
            <div>
              <p className="text-2xl font-black text-bronze">
                {Object.values(gameState.fragments).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-parchment/50">总碎片</p>
            </div>
            <div>
              <p className="text-2xl font-black text-bronze">{gameState.ownedRecipes.length}</p>
              <p className="text-xs text-parchment/50">拥有配方</p>
            </div>
          </div>
        </div>

        <Link href="/profile" className="ghost-button w-full text-center block mt-3">查看完整资料</Link>
        <Link href="/" className="ghost-button w-full text-center block mt-2">返回首页</Link>
      </div>
    </PageLayout>
  )
}
