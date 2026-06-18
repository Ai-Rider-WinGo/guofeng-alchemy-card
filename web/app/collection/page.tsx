'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { loadCards, getAllDynasties, getAllQualities, getAllTypes } from '@/lib/cardUtils'
import { filterCards, searchCards } from '@/lib/storage'
import { DYNASTY_META, type DynastyId } from '@/lib/types'

// ============ 中文标签映射 ============
const QUALITY_LABELS: Record<string, string> = {
  common: '凡品', fine: '精良', rare: '稀有',
  epic: '极品', divine: '神品', treasure: '至宝',
}

const TYPE_LABELS: Record<string, string> = {
  person: '人物', event: '事件', place: '地点',
  artifact: '文物', strategy: '战略',
}

export default function CollectionPage() {
  const { gameState } = useGame()
  const allCards = loadCards()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDynasty, setFilterDynasty] = useState<string>('')
  const [filterRarity, setFilterRarity] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const dynasties = getAllDynasties()
  const rarities = getAllQualities()
  const types = getAllTypes()

  // 统计当前激活的筛选数量
  const activeFilterCount = [filterDynasty, filterRarity, filterType].filter(Boolean).length

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
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-bronze mb-2">卡牌图鉴</h1>
          <p className="text-paper/60 text-sm">
            已收集 {unlockedCount} / {filteredCards.length}
          </p>
        </div>

        {/* 搜索 + 筛选按钮 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="搜索卡牌名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base flex-1"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              shrink-0 px-4 py-2 rounded-card text-sm font-bold border transition-all
              ${showFilters
                ? 'bg-bronze text-ink border-bronze'
                : 'border-bronze/30 text-bronze hover:border-bronze'}
            `}
          >
            筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>

        {/* ====== 筛选面板（默认隐藏） ====== */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-out
            ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="space-y-4 p-4 rounded-xl border border-bronze/20 bg-void-200/30">
            {/* 朝代 */}
            <div>
              <label className="text-xs font-bold text-bronze block mb-2">朝代</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterDynasty('')}
                  className={`px-3 py-1.5 text-xs rounded-card font-bold transition ${
                    filterDynasty === ''
                      ? 'bg-bronze text-ink'
                      : 'border border-bronze/20 text-parchment/60 hover:border-bronze/40 hover:text-parchment'
                  }`}
                >
                  全部
                </button>
                {dynasties.map((dynasty) => {
                  const meta = DYNASTY_META[dynasty as DynastyId]
                  return (
                    <button
                      key={dynasty}
                      onClick={() => setFilterDynasty(dynasty)}
                      className={`px-3 py-1.5 text-xs rounded-card font-bold transition ${
                        filterDynasty === dynasty
                          ? 'bg-bronze text-ink'
                          : 'border border-bronze/20 text-parchment/60 hover:border-bronze/40 hover:text-parchment'
                      }`}
                    >
                      {meta?.name || dynasty}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 稀有度 */}
            <div>
              <label className="text-xs font-bold text-bronze block mb-2">稀有度</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterRarity('')}
                  className={`px-3 py-1.5 text-xs rounded-card font-bold transition ${
                    filterRarity === ''
                      ? 'bg-bronze text-ink'
                      : 'border border-bronze/20 text-parchment/60 hover:border-bronze/40 hover:text-parchment'
                  }`}
                >
                  全部
                </button>
                {rarities.map((rarity) => (
                  <button
                    key={rarity}
                    onClick={() => setFilterRarity(rarity)}
                    className={`px-3 py-1.5 text-xs rounded-card font-bold transition ${
                      filterRarity === rarity
                        ? 'bg-bronze text-ink'
                        : 'border border-bronze/20 text-parchment/60 hover:border-bronze/40 hover:text-parchment'
                    }`}
                  >
                    {QUALITY_LABELS[rarity] || rarity}
                  </button>
                ))}
              </div>
            </div>

            {/* 类型 */}
            <div>
              <label className="text-xs font-bold text-bronze block mb-2">类型</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('')}
                  className={`px-3 py-1.5 text-xs rounded-card font-bold transition ${
                    filterType === ''
                      ? 'bg-bronze text-ink'
                      : 'border border-bronze/20 text-parchment/60 hover:border-bronze/40 hover:text-parchment'
                  }`}
                >
                  全部
                </button>
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-xs rounded-card font-bold transition ${
                      filterType === type
                        ? 'bg-bronze text-ink'
                        : 'border border-bronze/20 text-parchment/60 hover:border-bronze/40 hover:text-parchment'
                    }`}
                  >
                    {TYPE_LABELS[type] || type}
                  </button>
                ))}
              </div>
            </div>

            {/* 清除全部 */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterDynasty(''); setFilterRarity(''); setFilterType('') }}
                className="w-full py-2 text-xs font-bold text-bronze/50 hover:text-bronze border border-bronze/15 rounded-card transition"
              >
                清除全部筛选
              </button>
            )}
          </div>
        </div>

        {/* ====== 卡牌网格 ====== */}
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
                      quality={card.quality}
                      isRevealed
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] border-2 border-bronze/20 rounded-card flex items-center justify-center bg-void-200/30">
                      <div className="text-center">
                        <div className="text-3xl mb-2">❓</div>
                        <p className="text-xs text-parchment/30">未解锁</p>
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-parchment/50">暂无卡片匹配当前条件</p>
            <p className="text-xs text-parchment/30 mt-1">试试更换筛选或搜索关键词</p>
          </div>
        )}

        <Link href="/" className="btn-secondary-dark w-full text-center block mt-5">
          返回首页
        </Link>
      </div>
    </PageLayout>
  )
}
