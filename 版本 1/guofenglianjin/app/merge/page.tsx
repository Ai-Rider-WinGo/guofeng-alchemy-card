'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { CardDisplay } from '@/components/CardDisplay'
import { FragmentBar } from '@/components/FragmentBar'
import { useGame } from '@/lib/gameContext'
import { loadCards, canMerge, getCardById } from '@/lib/cardUtils'
import { executeMerge, removeCardFromInventory, addCardToInventory, getFragmentCount, consumeFragments, getStarUpCandidates, getRemainingAutoMerges, performAutoMerge, addAdAutoMerge } from '@/lib/storage'
import type { Card } from '@/lib/types'

type MergeTab = 'pair' | 'fragment' | 'starup'

export default function MergePage() {
  const { gameState, updateGameState } = useGame()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [activeTab, setActiveTab] = useState<MergeTab>('pair')
  const [selectedCard1, setSelectedCard1] = useState<string | null>(null)
  const [selectedCard2, setSelectedCard2] = useState<string | null>(null)
  const [mergeResult, setMergeResult] = useState<{ to: string; mergeDesc: string; resultCard: Card } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [invalidPair, setInvalidPair] = useState(false)
  // 自动合成
  const [autoMergeResult, setAutoMergeResult] = useState<{ card1Name: string; card2Name: string; resultName: string } | null>(null)
  const [autoMergeMsg, setAutoMergeMsg] = useState<string | null>(null)
  const remainingAuto = getRemainingAutoMerges(gameState)
  const [showAdGate, setShowAdGate] = useState(false)

  useEffect(() => { setAllCards(loadCards()) }, [])

  const playerCardList = allCards.filter((card) => (gameState.playerCards[card.id] || 0) > 0)
  const REQUIRED_SHARDS = 60
  const fragmentTargets = allCards.filter((card) => (gameState.playerCards[card.id] || 0) === 0)
  const starUpCandidates = getStarUpCandidates(gameState)

  const handleSelectCard = (cardId: string, isSecond: boolean) => {
    if (isSecond) setSelectedCard2(cardId); else setSelectedCard1(cardId)
    setMergeResult(null); setInvalidPair(false)
  }

  const handleCheckMerge = () => {
    if (!selectedCard1 || !selectedCard2) return
    const rule = canMerge(selectedCard1, selectedCard2)
    if (!rule) { setMergeResult(null); setInvalidPair(true); setTimeout(() => setInvalidPair(false), 2000); return }
    const resultCard = getCardById(rule.to)
    if (!resultCard) return
    setMergeResult({ rule, resultCard }); setInvalidPair(false)
  }

  const handleExecutePairMerge = () => {
    if (!selectedCard1 || !selectedCard2 || !mergeResult) return
    const newState = executeMerge(gameState, selectedCard1, selectedCard2, mergeResult.resultCard.id)
    updateGameState(newState)
    setSelectedCard1(null); setSelectedCard2(null); setMergeResult(null); setShowConfirm(false)
  }

  const handleFragmentMerge = (cardId: string) => {
    const fragments = getFragmentCount(gameState, cardId) || getFragmentCount(gameState, '秦汉')
    if (fragments < REQUIRED_SHARDS) return
    let newState = consumeFragments(gameState, cardId, REQUIRED_SHARDS)
    if ((newState.fragments?.[cardId] || 0) === (gameState.fragments?.[cardId] || 0)) {
      newState = consumeFragments(gameState, '秦汉', REQUIRED_SHARDS)
    }
    newState = addCardToInventory(newState, cardId)
    updateGameState(newState)
  }

  const handleStarUp = (cardId: string) => {
    updateGameState(removeCardFromInventory(gameState, cardId, 3))
  }

  const handleAutoMerge = () => {
    const { newState, success, card1Name, card2Name, resultName } = performAutoMerge(gameState)
    updateGameState(newState)
    if (success && card1Name && card2Name && resultName) {
      setAutoMergeResult({ card1Name, card2Name, resultName })
      setAutoMergeMsg(null)
      setTimeout(() => setAutoMergeResult(null), 4000)
    } else {
      setAutoMergeResult(null)
      setAutoMergeMsg('暂无可用合成配对，请先抽卡获取更多卡牌')
      setTimeout(() => setAutoMergeMsg(null), 3000)
    }
  }

  const handleAdAutoMerge = () => {
    // 广告激励预留接口 — 实际接入时替换为广告SDK调用
    setShowAdGate(false)
    const newState = addAdAutoMerge(gameState)
    updateGameState(newState)
    setAutoMergeMsg('广告观看完成，获得 +2 次自动合成机会')
    setTimeout(() => setAutoMergeMsg(null), 2500)
  }

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">历史熔合</p>
            <h1 className="screen-title">合成</h1>
            <p className="screen-subtitle">融合历史碎片，创造传说卡牌</p>
          </div>
          <Link href="/tasks" className="atlas-chip">
            <span className="atlas-medal">任</span>
          </Link>
        </header>

        {/* 统计面板 */}
        <section className="daily-scroll-panel">
          <div className="scroll-art">
            <img src="/ui/reference-cauldron.png" alt="合成" />
            <img className="smoke-layer" src="/ui/reference-smoke.png" alt="" aria-hidden="true" />
          </div>
          <div className="draw-counter">
            <div className="panel-label"><span />已完成<b>⚗</b></div>
            <div className="draw-count"><strong>{gameState.totalMerges || 0}</strong><span>次</span></div>
            <p>选择两张卡牌进行熔合</p>
            <div className="hero-actions">
              <span className="text-center text-parchment/60 text-xs py-2">
                {Object.keys(gameState.playerCards).length} 种卡 · {Object.values(gameState.fragments || {}).reduce((a, b) => a + b, 0)} 碎片
              </span>
            </div>
          </div>
          <div className="reset-seal">合成工坊</div>
        </section>

        {/* 自动合成 — 独立醒目区域 */}
        <section className="mt-4 parchment-strip p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-ink">⚡ 自动合成</p>
              <p className="text-xs text-ink/60 mt-0.5">一键智能匹配最优合成路径</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/50">今日剩余</p>
              <p className="text-lg font-black text-jade">{remainingAuto} 次</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handleAutoMerge}
              disabled={remainingAuto <= 0}
              className="ritual-button w-full text-sm">
              ⚡ 自动合成
            </button>
            <button
              onClick={() => setShowAdGate(true)}
              className="ghost-button w-full text-sm">
              📺 看广告 +2次
            </button>
          </div>
        </section>

        {/* Tab 切换 */}
        <div className="mt-4 flex rounded-card border border-bronze/25 bg-black/25 p-1">
          {(['pair', 'fragment', 'starup'] as MergeTab[]).map((tab) => {
            const labels: Record<MergeTab, string> = { pair: '人物合成', fragment: '碎片合成', starup: '升星' }
            return (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setSelectedCard1(null); setSelectedCard2(null); setMergeResult(null); setInvalidPair(false) }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === tab ? 'bg-bronze text-ink shadow-lg' : 'text-parchment/60 hover:text-parchment'
                }`}>{labels[tab]}</button>
            )
          })}
        </div>

        {/* Tab 1: 人物合成 */}
        {activeTab === 'pair' && (
          <div className="mt-4 space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-bold text-bronze">选择第一张卡片</label>
              {selectedCard1 && getCardById(selectedCard1) ? (
                <div className="flex gap-4 items-start">
                  <div className="w-24"><CardDisplay cardId={selectedCard1} cardName={getCardById(selectedCard1)!.name} level={getCardById(selectedCard1)!.level} quality={getCardById(selectedCard1)!.rarity} isRevealed /></div>
                  <button onClick={() => { setSelectedCard1(null); setMergeResult(null) }} className="ghost-button">更换</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                  {playerCardList.map((card) => (
                    <button key={card.id} onClick={() => handleSelectCard(card.id, false)} className="hover:opacity-80 transition">
                      <CardDisplay cardId={card.id} cardName={card.name} level={card.level} quality={card.rarity} isRevealed />
                      <p className="text-xs text-parchment/60 mt-1 text-center">×{gameState.playerCards[card.id]}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCard1 && <div className="flex justify-center text-3xl text-bronze font-black">+</div>}

            {selectedCard1 && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-bronze">选择第二张卡片</label>
                {selectedCard2 && getCardById(selectedCard2) ? (
                  <div className="flex gap-4 items-start">
                    <div className="w-24"><CardDisplay cardId={selectedCard2} cardName={getCardById(selectedCard2)!.name} level={getCardById(selectedCard2)!.level} quality={getCardById(selectedCard2)!.rarity} isRevealed /></div>
                    <button onClick={() => { setSelectedCard2(null); setMergeResult(null) }} className="ghost-button">更换</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                    {playerCardList.filter((c) => c.id !== selectedCard1).map((card) => (
                      <button key={card.id} onClick={() => handleSelectCard(card.id, true)} className="hover:opacity-80 transition">
                        <CardDisplay cardId={card.id} cardName={card.name} level={card.level} quality={card.rarity} isRevealed />
                        <p className="text-xs text-parchment/60 mt-1 text-center">×{gameState.playerCards[card.id]}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedCard1 && selectedCard2 && !mergeResult && (
              <button onClick={handleCheckMerge} className="ritual-button w-full">检查合成</button>
            )}

            {invalidPair && (
              <div className="bronze-panel p-4 text-center animate-slide-up">
                <p className="text-parchment/70 text-sm">这两张卡片无法合成</p>
                <p className="text-xs text-parchment/50 mt-2">尝试其他历史人物组合</p>
              </div>
            )}

            {mergeResult && (
              <div className="bronze-panel p-5 space-y-4 animate-slide-up">
                <div className="text-center">
                  <h2 className="text-lg font-black text-jade mb-3">✨ 可合成 ✨</h2>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-14"><CardDisplay cardId={selectedCard1!} cardName={getCardById(selectedCard1!)!.name} level={getCardById(selectedCard1!)!.level} quality={getCardById(selectedCard1!)!.rarity} isRevealed /></div>
                    <span className="text-xl text-bronze">+</span>
                    <div className="w-14"><CardDisplay cardId={selectedCard2!} cardName={getCardById(selectedCard2!)!.name} level={getCardById(selectedCard2!)!.level} quality={getCardById(selectedCard2!)!.rarity} isRevealed /></div>
                    <span className="text-xl text-bronze">→</span>
                    <div className="w-14"><CardDisplay cardId={mergeResult.resultCard.id} cardName={mergeResult.resultCard.name} level={mergeResult.resultCard.level} quality={mergeResult.resultCard.rarity} isRevealed /></div>
                  </div>
                </div>
                <div className="bg-black/20 p-3 rounded space-y-2">
                  <p className="text-sm font-bold text-bronze">历史渊源</p>
                  <p className="text-xs text-parchment/70 leading-relaxed">{mergeResult.mergeDesc}</p>
                </div>
                <div className="bg-black/20 p-3 rounded">
                  <p className="text-parchment font-bold">{mergeResult.resultCard.name}</p>
                  <p className="text-xs text-parchment/60 mt-1">{mergeResult.resultCard.description}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setMergeResult(null); setSelectedCard1(null); setSelectedCard2(null) }} className="ghost-button flex-1">重新选择</button>
                  <button onClick={() => setShowConfirm(true)} className="ritual-button flex-1">确认合成</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 碎片合成 */}
        {activeTab === 'fragment' && (
          <div className="mt-4 space-y-4">
            <div className="bronze-panel p-4">
              <div className="grid grid-cols-3 divide-x divide-bronze/20 text-center">
                <div><p className="text-xs text-parchment/50">秦汉碎片</p><p className="mt-1 text-xl font-black text-bronze">{getFragmentCount(gameState, '秦汉')}</p></div>
                <div><p className="text-xs text-parchment/50">通用碎片</p><p className="mt-1 text-xl font-black text-bronze">{getFragmentCount(gameState, 'general')}</p></div>
                <div><p className="text-xs text-parchment/50">需碎片数</p><p className="mt-1 text-xl font-black text-parchment/50">{REQUIRED_SHARDS}</p></div>
              </div>
            </div>
            <div className="ornate-title compact"><span />可合成卡牌<span /></div>
            {fragmentTargets.length > 0 ? (
              <div className="space-y-3">
                {fragmentTargets.map((card) => {
                  const owned = getFragmentCount(gameState, card.id) || getFragmentCount(gameState, card.dynasty) || 0
                  return <FragmentBar key={card.id} cardName={card.name} cardId={card.id} required={REQUIRED_SHARDS} owned={owned} onMerge={() => handleFragmentMerge(card.id)} />
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-parchment/40"><p className="text-4xl mb-3">💎</p><p className="text-sm">所有卡牌已收集完毕</p></div>
            )}
          </div>
        )}

        {/* Tab 3: 升星 */}
        {activeTab === 'starup' && (
          <div className="mt-4 space-y-4">
            <div className="bronze-panel p-4 text-center">
              <p className="text-sm text-parchment/70">3 张同名同星卡 → 升 1 星</p>
              <p className="text-xs text-parchment/50 mt-1">升星后属性提升，卡面强化</p>
            </div>
            <div className="ornate-title compact"><span />可升星卡牌<span /></div>
            {starUpCandidates.length > 0 ? (
              <div className="space-y-3">
                {starUpCandidates.map(({ cardId, count }) => {
                  const card = getCardById(cardId)
                  if (!card) return null
                  const maxStars = Math.floor(count / 3)
                  return (
                    <div key={cardId} className="bronze-panel p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 shrink-0"><CardDisplay cardId={card.id} cardName={card.name} level={card.level} quality={card.rarity} isRevealed /></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-parchment truncate">{card.name}</h3>
                          <p className="text-xs text-parchment/50">拥有 {count} 张</p>
                          <div className="mt-1.5 flex gap-1">
                            {Array.from({ length: Math.min(maxStars, 5) }).map((_, i) => <span key={i} className="text-sm">⭐</span>)}
                            {maxStars > 0 && <span className="text-xs text-jade ml-1">可升 {maxStars} 星</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleStarUp(cardId)} className="ritual-button w-full mt-3 py-2 text-sm">升星 · 消耗 3 张</button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-parchment/40"><p className="text-4xl mb-3">⭐</p><p className="text-sm">暂无卡牌可升星</p></div>
            )}
          </div>
        )}

        {showConfirm && mergeResult && (
          <div className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 p-4 safe-area-inset backdrop-blur-sm">
            <div className="parchment-strip p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-black text-ink">确认合成？</h3>
              <p className="text-sm text-ink/70">消耗 <strong>{getCardById(selectedCard1!)?.name}</strong> 和 <strong>{getCardById(selectedCard2!)?.name}</strong>，获得 <strong className="text-jade">{mergeResult.resultCard.name}</strong></p>
              <p className="text-xs text-ink/50">此操作不可撤销</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="ghost-button flex-1">取消</button>
                <button onClick={handleExecutePairMerge} className="ritual-button flex-1">确认合成</button>
              </div>
            </div>
          </div>
        )}

        {/* 自动合成结果提示 */}
        {autoMergeResult && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="bronze-panel px-5 py-3 text-center whitespace-nowrap">
              <p className="text-sm font-bold text-jade">⚡ 自动合成完成</p>
              <p className="text-xs text-parchment/70 mt-1">
                {autoMergeResult.card1Name} + {autoMergeResult.card2Name} → <span className="text-bronze font-bold">{autoMergeResult.resultName}</span>
              </p>
            </div>
          </div>
        )}

        {autoMergeMsg && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="bronze-panel px-5 py-3 text-center whitespace-nowrap">
              <p className="text-xs text-parchment/70">{autoMergeMsg}</p>
            </div>
          </div>
        )}

        {/* 广告激励弹窗（预留） */}
        {showAdGate && (
          <div className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 p-4 safe-area-inset backdrop-blur-sm">
            <div className="parchment-strip p-6 max-w-sm w-full space-y-4 text-center">
              <p className="text-4xl">📺</p>
              <h3 className="text-lg font-black text-ink">获取额外合成次数</h3>
              <p className="text-sm text-ink/70">
                观看一段激励广告，获得 <strong className="text-jade">+2 次</strong> 自动合成机会
              </p>
              <p className="text-xs text-ink/40">广告接口已预留，接入抖音广告 SDK 后启用</p>
              <div className="flex gap-3">
                <button onClick={() => setShowAdGate(false)} className="ghost-button flex-1">取消</button>
                <button onClick={handleAdAutoMerge} className="ritual-button flex-1">
                  观看广告 (+2次)
                </button>
              </div>
            </div>
          </div>
        )}

        <Link href="/" className="ghost-button w-full text-center block mt-5">返回首页</Link>
      </div>
    </PageLayout>
  )
}
