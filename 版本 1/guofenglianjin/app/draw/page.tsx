'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { PoolDetailModal } from '@/components/PoolDetailModal'
import { useGame } from '@/lib/gameContext'
import { drawFromPool, getCardById, loadCards, loadDrawPools } from '@/lib/cardUtils'
import { getRemainingDraws, addCardToInventory, calculateStars, convertDuplicateToFragment, updateTaskProgress } from '@/lib/storage'
import type { Card } from '@/lib/types'
import { DUPLICATION_FOR_STAR } from '@/lib/types'

interface DrawResult {
  cardId: string; card: Card; isNew: boolean; starCount: number; wasConverted: boolean; shardAmount?: number; shardType?: string
}

export default function DrawPage() {
  const { gameState, updateGameState } = useGame()
  const [drawResults, setDrawResults] = useState<DrawResult[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showPoolDetail, setShowPoolDetail] = useState(false)
  const remainingDraws = getRemainingDraws(gameState)
  const allCards = loadCards()
  const pools = loadDrawPools()
  const currentPool = pools.find((p) => p.pool_id === 'permanent_basic')
  const poolCardList = (currentPool?.active_card_ids || []).map((id) => allCards.find((c) => c.id === id)).filter((c): c is Card => c !== undefined).map((c) => ({ id: c.id, name: c.name, rarity: c.quality, level: c.level }))

  const processDraw = (cardId: string, currentState: typeof gameState) => {
    const card = getCardById(cardId)
    if (!card) return { result: null as any, newState: currentState }
    const isNew = !currentState.unlockedCards.includes(cardId)
    const currentCount = (currentState.playerCards[cardId] || 0) + 1
    const starCount = calculateStars(currentCount, DUPLICATION_FOR_STAR)
    const isDuplicate = currentCount > 1
    const result: DrawResult = { cardId, card, isNew, starCount, wasConverted: isDuplicate }
    let newState = addCardToInventory(currentState, cardId)
    if (isDuplicate) { newState = convertDuplicateToFragment(newState, cardId, card.level, card.dynasty); result.shardAmount = card.level === 1 ? 5 : card.level === 2 ? 10 : card.level >= 3 ? 3 : 1; result.shardType = card.level >= 3 ? card.name : card.dynasty }
    return { result, newState }
  }

  const handleSingleDraw = async () => {
    if (remainingDraws === 0) return; setIsDrawing(true); setSelectedIndex(null); setDrawResults([])
    await new Promise((r) => setTimeout(r, 400))
    const cardId = drawFromPool('permanent_basic'); if (!cardId) { setIsDrawing(false); return }
    const { result, newState } = processDraw(cardId, gameState); if (!result) { setIsDrawing(false); return }
    const finalState = updateTaskProgress(updateTaskProgress({ ...newState, dailyDrawCount: newState.dailyDrawCount + 1 }, 'daily_draw', 1), 'daily_login', 1)
    updateGameState(finalState); setDrawResults([result]); setSelectedIndex(0); setIsDrawing(false)
  }

  const handleTenDraw = async () => {
    if (remainingDraws < 10) return; setIsDrawing(true); setSelectedIndex(null); setDrawResults([])
    await new Promise((r) => setTimeout(r, 600))
    const results: DrawResult[] = []; let newState = gameState
    for (let i = 0; i < 10; i++) { const cardId = drawFromPool('permanent_basic'); if (!cardId) continue; const { result } = processDraw(cardId, newState); if (!result) continue; results.push(result); newState = addCardToInventory(newState, cardId) }
    setDrawResults(results)
    const finalState = updateTaskProgress(updateTaskProgress({ ...newState, dailyDrawCount: newState.dailyDrawCount + results.length }, 'daily_draw', results.length), 'daily_login', 1)
    updateGameState(finalState); setIsDrawing(false)
  }

  const handleContinue = () => { setDrawResults([]); setSelectedIndex(null) }
  const convertedCount = drawResults.filter((r) => r.wasConverted).length
  const totalShards = drawResults.reduce((sum, r) => sum + (r.shardAmount || 0), 0)

  if (drawResults.length > 0 && selectedIndex === null && !isDrawing) {
    return (
      <PageLayout>
        <div className="screen-shell">
          <h1 className="text-2xl font-black text-bronze text-center mb-5">抽卡结果</h1>
          {drawResults.length === 1 ? (
            <div className="space-y-4">
              <div className="flex justify-center"><div className="w-48 animate-flip-in"><CardDisplay cardId={drawResults[0].cardId} cardName={drawResults[0].card.name} level={drawResults[0].card.level} quality={drawResults[0].card.rarity} isRevealed /></div></div>
              <div className="bronze-panel p-4 space-y-2">
                <div className="flex items-center justify-between"><span className="text-parchment/70">等级</span><span className="text-lg font-bold text-bronze">{drawResults[0].card.level}</span></div>
                <div className="flex items-center justify-between"><span className="text-parchment/70">稀有度</span><span className="text-lg font-bold text-bronze">{drawResults[0].card.rarity}</span></div>
                {drawResults[0].isNew ? (<div className="p-2 bg-jade/20 rounded text-center"><span className="text-jade font-bold">✨ 新卡解锁 ✨</span></div>) : (<div className="p-2 bg-bronze/20 rounded text-center space-y-1"><span className="text-bronze font-bold block">重复卡 · 已转化</span><span className="text-xs text-parchment/60">已有 {drawResults[0].starCount}⭐ · {drawResults[0].shardType}碎片 +{drawResults[0].shardAmount}</span></div>)}
                <p className="text-sm text-parchment/70 mt-3">{drawResults[0].card.description}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {convertedCount > 0 && (<div className="bronze-panel p-3 text-center"><p className="text-sm text-bronze font-bold">{convertedCount} 张重复卡 · 共获得碎片 +{totalShards}</p></div>)}
              <div className="grid grid-cols-3 gap-2">
                {drawResults.map((result, index) => (<button key={index} onClick={() => setSelectedIndex(index)} className={`transition-transform hover:scale-105 ${result.isNew ? 'ring-2 ring-jade/50 rounded-card' : ''}`}><CardDisplay cardId={result.cardId} cardName={result.card.name} level={result.card.level} quality={result.card.rarity} isRevealed /><p className="text-[10px] text-center mt-1 text-parchment/50">{result.isNew ? '🆕 新卡' : `⭐×${result.starCount}`}</p></button>))}
              </div>
              {selectedIndex !== null && (<div className="bronze-panel p-4 space-y-2 animate-slide-up"><h2 className="text-lg font-black text-bronze">{drawResults[selectedIndex].card.name}</h2><div className="flex items-center justify-between text-sm"><span className="text-parchment/70">等级 {drawResults[selectedIndex].card.level}</span><span className="text-parchment/70">{drawResults[selectedIndex].card.rarity}</span></div>{drawResults[selectedIndex].isNew ? (<span className="inline-block text-jade font-bold">✨ 新卡解锁</span>) : (<span className="inline-block text-bronze font-bold">重复 ({drawResults[selectedIndex].starCount}⭐) · 碎片+{drawResults[selectedIndex].shardAmount}</span>)}<p className="text-xs text-parchment/60 mt-2">{drawResults[selectedIndex].card.description}</p></div>)}
            </div>
          )}
          <div className="flex gap-3 mt-5"><button onClick={handleContinue} className="ghost-button flex-1">继续抽卡</button><Link href="/" className="ritual-button flex-1 text-center">返回首页</Link></div>
        </div>
      </PageLayout>
    )
  }

  const displayRemaining = Math.min(remainingDraws, 12)

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">命运之卡</p>
            <h1 className="screen-title">抽卡</h1>
            <p className="screen-subtitle">探寻历史中的传奇人物</p>
          </div>
          <Link href="/collection" className="atlas-chip"><span className="atlas-medal">册</span></Link>
        </header>

        <section className="daily-scroll-panel">
          <div className="scroll-art">
            <img src="/ui/reference-cauldron.png" alt="抽卡" />
            <img className="smoke-layer" src="/ui/reference-smoke.png" alt="" aria-hidden="true" />
          </div>
          <div className="draw-counter">
            <div className="panel-label"><span />剩余次数<b>!</b></div>
            <div className="draw-count"><strong>{displayRemaining}</strong><span>/12</span></div>
            <p>每日免费次数</p>
            <div className="hero-actions">
              <button onClick={() => setShowPoolDetail(true)}>卡池详情</button>
              <Link href="/tasks">任务中心</Link>
            </div>
          </div>
          <div className="reset-seal">每日重置</div>
        </section>

        <div className="mt-4 space-y-3">
          <button onClick={handleSingleDraw} disabled={remainingDraws === 0 || isDrawing}
            className={`w-full py-4 rounded-sm text-lg font-black tracking-[0.1em] transition-all ${remainingDraws === 0 ? 'bg-paper/20 text-paper/40 cursor-not-allowed' : 'ritual-button'}`}>
            {isDrawing ? '抽卡中...' : '抽 1 次'}
          </button>
          <button onClick={handleTenDraw} disabled={remainingDraws < 10 || isDrawing}
            className={`w-full py-4 rounded-sm text-lg font-black tracking-[0.1em] transition-all ${remainingDraws < 10 ? 'bg-paper/20 text-paper/40 cursor-not-allowed' : 'ritual-button'}`}>
            {isDrawing ? '抽卡中...' : '十连抽'}
          </button>
        </div>

        <div className="bronze-panel p-4 mt-4">
          <div className="ornate-title compact mb-3"><span />玩法提示<span /></div>
          <ul className="space-y-2 text-xs text-parchment/70 leading-relaxed">
            <li>· 重复 Lv.1 卡 → <span className="text-jade font-bold">同朝代碎片 ×5</span></li>
            <li>· 重复 Lv.2 卡 → <span className="text-jade font-bold">同朝代碎片 ×10</span></li>
            <li>· 重复 Lv.3+ 卡 → <span className="text-jade font-bold">该卡升星碎片</span></li>
            <li>· 3 张同名同星 → 可升 1 星</li>
          </ul>
        </div>

        <Link href="/" className="ghost-button w-full text-center block mt-5">返回首页</Link>

        <PoolDetailModal poolName={currentPool?.name || '基础卡池'} isOpen={showPoolDetail} onClose={() => setShowPoolDetail(false)} rarityWeights={currentPool?.rarity_weights || {}} cardList={poolCardList} />
      </div>
    </PageLayout>
  )
}
