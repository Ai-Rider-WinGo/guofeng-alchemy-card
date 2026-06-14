'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { useGame } from '@/lib/gameContext'
import { loadCards, getAllDynasties, getAllRarities, getAllTypes } from '@/lib/cardUtils'
import { filterCards, searchCards } from '@/lib/storage'

const typeLabels: Record<string, string> = {
  person: '人物',
  event: '事件',
  strategy: '谋略',
  place: '地名',
}

export default function CollectionPage() {
  const { gameState } = useGame()
  const allCards = loadCards()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDynasty, setFilterDynasty] = useState('')
  const [filterRarity, setFilterRarity] = useState('')
  const [filterType, setFilterType] = useState('')

  const dynasties = getAllDynasties()
  const rarities = getAllRarities()
  const types = getAllTypes()

  const filteredCards = useMemo(() => {
    let cards = [...allCards]

    if (searchQuery) cards = searchCards(cards, searchQuery)

    return filterCards(cards, {
      dynasty: filterDynasty || undefined,
      rarity: filterRarity || undefined,
      type: filterType || undefined,
    })
  }, [allCards, searchQuery, filterDynasty, filterRarity, filterType])

  const unlockedCount = filteredCards.filter((card) => gameState.unlockedCards.includes(card.id)).length
  const progress = filteredCards.length === 0 ? 0 : Math.round((unlockedCount / filteredCards.length) * 100)

  const filterButton = (active: boolean) =>
    `shrink-0 rounded-sm border px-3 py-2 text-xs font-bold transition ${
      active ? 'border-bronze bg-bronze text-ink' : 'border-bronze/25 bg-black/20 text-parchment/70'
    }`

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">历史图鉴</p>
            <h1 className="screen-title">卡牌图鉴</h1>
            <p className="screen-subtitle">按朝代、稀有度和类型整理所有卡牌，点亮你的楚汉卡册。</p>
          </div>
          <Link href="/" className="ghost-button shrink-0 px-3 py-2">
            首页
          </Link>
        </header>

        <section className="bronze-panel p-4">
          <div className="relative z-10 grid grid-cols-[90px_1fr] gap-4">
            <img className="h-[105px] w-[90px] object-contain" src="/ui/action-art-archive.png" alt="图鉴书册" />
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold tracking-[0.28em] text-bronze/70">COLLECTION</p>
              <div className="mt-2 flex items-end gap-2">
                <strong className="text-[42px] leading-none text-parchment">{unlockedCount}</strong>
                <span className="pb-1 text-sm font-bold text-parchment/55">/ {filteredCards.length}</span>
              </div>
              <div className="runtime-progress mt-3">
                <i style={{ width: `${Math.max(progress, 8)}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="搜索卡牌名称或简介"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="input-base w-full"
          />

          <div className="bronze-panel p-3">
            <div className="relative z-10 space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterDynasty('')} className={filterButton(filterDynasty === '')}>
                  全部朝代
                </button>
                {dynasties.map((dynasty) => (
                  <button key={dynasty} onClick={() => setFilterDynasty(dynasty)} className={filterButton(filterDynasty === dynasty)}>
                    {dynasty}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterRarity('')} className={filterButton(filterRarity === '')}>
                  全部稀有度
                </button>
                {rarities.map((rarity) => (
                  <button key={rarity} onClick={() => setFilterRarity(rarity)} className={filterButton(filterRarity === rarity)}>
                    {rarity}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterType('')} className={filterButton(filterType === '')}>
                  全部类型
                </button>
                {types.map((type) => (
                  <button key={type} onClick={() => setFilterType(type)} className={filterButton(filterType === type)}>
                    {typeLabels[type] ?? type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="ornate-title compact">
            <span />
            卡册
            <span />
          </div>

          {filteredCards.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {filteredCards.map((card) => {
                const isUnlocked = gameState.unlockedCards.includes(card.id)
                return (
                  <Link key={card.id} href={`/card/${card.id}`} className="transition active:scale-[0.98]">
                    <CardDisplay
                      cardId={card.id}
                      cardName={isUnlocked ? card.name : '未解锁'}
                      level={card.level}
                      rarity={card.rarity}
                      isRevealed={isUnlocked}
                    />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bronze-panel mt-4 p-8 text-center text-sm text-parchment/60">
              暂无卡牌匹配当前筛选。
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  )
}
