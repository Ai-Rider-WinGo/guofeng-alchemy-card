'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { loadCards, getAllDynasties, getAllRarities, getAllTypes } from '@/lib/cardUtils'
import { filterCards, searchCards } from '@/lib/storage'

export default function CollectionPage() {
  const { gameState } = useGame()
  const allCards = loadCards()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDynasty, setFilterDynasty] = useState<string>('')
  const [filterRarity, setFilterRarity] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  const dynasties = getAllDynasties()
  const rarities = getAllRarities()
  const types = getAllTypes()

  const filteredCards = useMemo(() => {
    let cards = [...allCards]

    if (searchQuery) {
      cards = searchCards(cards, searchQuery)
    }

    cards = filterCards(cards, {
      dynasty: filterDynasty || undefined,
      rarity: filterRarity || undefined,
      type: filterType || undefined,
    })

    return cards
  }, [allCards, searchQuery, filterDynasty, filterRarity, filterType])

  const unlockedCount = filteredCards.filter((c) => gameState.unlockedCards.includes(c.id)).length

  return (
    <PageLayout>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-bronze mb-2">卡牌图鉴</h1>
          <p className="text-paper/60 text-sm">
            已收集 {unlockedCount} / {filteredCards.length}
          </p>
        </div>

        {/* 搜索 */}
        <input
          type="text"
          placeholder="搜索卡牌名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base w-full"
        />

        {/* 过滤器 */}
        <div className="space-y-2">
          <div>
            <label className="text-xs font-bold text-bronze block mb-2">朝代</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterDynasty('')}
                className={`px-3 py-1 text-xs rounded-card transition ${
                  filterDynasty === ''
                    ? 'bg-bronze text-ink'
                    : 'border border-bronze/30 text-paper hover:border-bronze'
                }`}
              >
                全部
              </button>
              {dynasties.map((dynasty) => (
                <button
                  key={dynasty}
                  onClick={() => setFilterDynasty(dynasty)}
                  className={`px-3 py-1 text-xs rounded-card transition ${
                    filterDynasty === dynasty
                      ? 'bg-bronze text-ink'
                      : 'border border-bronze/30 text-paper hover:border-bronze'
                  }`}
                >
                  {dynasty}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-bronze block mb-2">稀有度</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterRarity('')}
                className={`px-3 py-1 text-xs rounded-card transition ${
                  filterRarity === ''
                    ? 'bg-bronze text-ink'
                    : 'border border-bronze/30 text-paper hover:border-bronze'
                }`}
              >
                全部
              </button>
              {rarities.map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => setFilterRarity(rarity)}
                  className={`px-3 py-1 text-xs rounded-card transition ${
                    filterRarity === rarity
                      ? 'bg-bronze text-ink'
                      : 'border border-bronze/30 text-paper hover:border-bronze'
                  }`}
                >
                  {rarity}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-bronze block mb-2">类型</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('')}
                className={`px-3 py-1 text-xs rounded-card transition ${
                  filterType === ''
                    ? 'bg-bronze text-ink'
                    : 'border border-bronze/30 text-paper hover:border-bronze'
                }`}
              >
                全部
              </button>
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs rounded-card transition ${
                    filterType === type
                      ? 'bg-bronze text-ink'
                      : 'border border-bronze/30 text-paper hover:border-bronze'
                  }`}
                >
                  {type === 'person' ? '人物' : type === 'event' ? '事件' : '战略'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 卡牌网格 */}
        <div>
          {filteredCards.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredCards.map((card) => {
                const isUnlocked = gameState.unlockedCards.includes(card.id)
                return (
                  <Link
                    key={card.id}
                    href={`/card/${card.id}`}
                    className="hover:opacity-80 transition"
                  >
                    {isUnlocked ? (
                      <CardDisplay
                        cardId={card.id}
                        cardName={card.name}
                        level={card.level}
                        rarity={card.rarity}
                        isRevealed
                      />
                    ) : (
                      <div className="card-frame w-full aspect-[2/3] border-2 border-bronze/20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl mb-2">❓</div>
                          <p className="text-xs text-paper/30">未解锁</p>
                        </div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-paper/60">暂无卡片匹配过滤条件</p>
            </div>
          )}
        </div>

        <Link href="/" className="btn-secondary w-full text-center block">
          返回首页
        </Link>
      </div>
    </PageLayout>
  )
}
