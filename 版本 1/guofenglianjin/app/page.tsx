'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { RewardBadge } from '@/components/RewardBadge'
import { useGame } from '@/lib/gameContext'
import { loadCards, loadDrawPools } from '@/lib/cardUtils'
import { getCollectionProgress, getRemainingDraws, updateWeeklyCollectionProgress, claimWeeklyReward } from '@/lib/storage'
import weeklyRewardsData from '@/config/weekly_collection_rewards.json'

// 朝代标签 → 展示信息
const DYNASTY_DISPLAY: Record<string, { label: string; desc: string; icon: string; color: string; cardDynastyPattern: string }> = {
  qin_han:  { label: '秦月汉关', desc: '楚汉争霸', icon: '🏯', color: '#8a5b25', cardDynastyPattern: '秦汉|汉初' },
  tang:     { label: '盛唐气象', desc: '万国来朝', icon: '🏰', color: '#c9a961', cardDynastyPattern: '唐' },
  song:     { label: '大宋风华', desc: '文治天下', icon: '🏛️', color: '#6b8e9e', cardDynastyPattern: '宋' },
  ming:     { label: '大明雄风', desc: '七下西洋', icon: '⛩️', color: '#9e6b6b', cardDynastyPattern: '明' },
  three_kingdoms: { label: '三国争霸', desc: '群雄逐鹿', icon: '⚔️', color: '#6b9e6b', cardDynastyPattern: '三国' },
  spring_autumn_warring_states: { label: '春秋战国', desc: '百家争鸣', icon: '📜', color: '#8e6b9e', cardDynastyPattern: '春秋|战国' },
}

const collectionStats = [
  { label: '历史人物', value: '68/128', mark: '人' },
  { label: '重大事件', value: '36/64', mark: '史' },
  { label: '典籍文物', value: '24/64', mark: '卷' },
]

const quickActions = [
  { href: '/draw', title: '抽卡', desc: '炉烟起，卡牌显现', image: '/ui/action-art-draw.png', cta: '前往抽卡', tone: 'green' as const },
  { href: '/merge', title: '合成', desc: '三卡合一，英雄进阶', image: '/ui/action-art-merge.png', cta: '前往合成', tone: 'gold' as const },
  { href: '/collection', title: '图鉴', desc: '解锁典藏，阅览历史', image: '/ui/action-art-archive.png', cta: '查看图鉴', tone: 'blue' as const },
]

const BANNER_INTERVAL = 4500

export default function HomePage() {
  const { gameState, updateGameState } = useGame()
  const allCards = loadCards()
  const pools = loadDrawPools()
  const weeklyPool = pools.find((p) => p.pool_id === 'weekly_qinhan')
  const rotationSchedule: Array<{ week: number; dynasty_tag: string; theme_name: string }> =
    (weeklyPool as any)?.rotation_schedule || []
  const collectionProgress = getCollectionProgress(gameState, allCards)
  // 全量母卡 2,130 张（策划案 12 级体系），当前按实际已解锁 / 全量计算
  const FULL_TOTAL = 2130
  const progressPercent = Math.max(1, Math.min(100, Math.round((collectionProgress.unlocked / FULL_TOTAL) * 100)))
  const remainingDraws = Math.min(getRemainingDraws(gameState), 12)
  const totalFragments = Object.values(gameState.fragments || {}).reduce((a, b) => a + b, 0)

  const [bannerIndex, setBannerIndex] = useState(0)
  const totalSlides = 3

  const nextSlide = useCallback(() => setBannerIndex((prev) => (prev + 1) % totalSlides), [])

  useEffect(() => {
    const timer = setInterval(nextSlide, BANNER_INTERVAL)
    return () => clearInterval(timer)
  }, [nextSlide])

  const weeklyRewardConfig = (weeklyRewardsData as any).weekly_qinhan
  const currentWeeklyState = gameState.weeklyRewards?.['weekly_qinhan']
  const collectedCount = currentWeeklyState?.collectedCount || collectionProgress.unlocked
  const claimedTiers = currentWeeklyState?.claimedTiers || []

  useEffect(() => {
    if (collectedCount !== collectionProgress.unlocked) {
      updateGameState(updateWeeklyCollectionProgress(gameState, 'weekly_qinhan', collectionProgress.unlocked))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const handleClaimWeekly = (tierIndex: number) => {
    const tier = weeklyRewardConfig?.tiers?.[tierIndex]
    if (!tier) return
    updateGameState(claimWeeklyReward(gameState, 'weekly_qinhan', tierIndex, tier.reward))
  }

  // 倒计时（周几重置）
  const now = new Date()
  const daysUntilSunday = 7 - now.getDay()
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday))
  weekEnd.setHours(23, 59, 59)
  const resetDay = ['日', '一', '二', '三', '四', '五', '六'][weekEnd.getDay()]

  return (
    <PageLayout>
      <div className="home-shell">
        <header className="hero-header">
          <div className="brand-lockup">
            <p>楚汉篇</p>
            <h1>国风炼金卡牌</h1>
          </div>
          <Link href="/collection" className="atlas-chip">
            <span className="atlas-medal">册</span>
            <span>图鉴进度<strong>{collectionProgress.unlocked}/{FULL_TOTAL}</strong></span>
          </Link>
        </header>

        {/* ====== Banner 轮播 3 屏 ====== */}
        <section className="relative z-10 overflow-hidden rounded-[10px] border border-bronze/40">
          <div className="flex transition-transform duration-500 ease-out"
               style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>

            {/* 第1屏：当前抽卡主题 */}
            <div className="daily-scroll-panel shrink-0 w-full">
              <div className="scroll-art">
                <img src="/ui/reference-cauldron.png" alt="卡池" />
                <img className="smoke-layer" src="/ui/reference-smoke.png" alt="" aria-hidden="true" />
              </div>
              <div className="draw-counter">
                <div className="panel-label"><span />当前卡池<b>秦</b></div>
                <div className="py-2 text-center">
                  <p className="text-2xl font-black text-ink tracking-[0.08em]">
                    {weeklyPool?.name || '秦汉风云'}
                  </p>
                  <p className="text-xs text-ink/60 mt-1">每周{resetDay} 23:59 轮换</p>
                </div>
                <p className="text-xs text-ink/60">今日剩余抽卡 {remainingDraws} 次</p>
                <div className="hero-actions">
                  <Link href="/draw">前往抽卡</Link>
                  <Link href="/draw">卡池预览</Link>
                </div>
              </div>
              <div className="reset-seal">{weeklyPool?.name?.slice(0, 2) || '秦汉'}</div>
            </div>

            {/* 第2屏：签到4倍碎片活动 */}
            <div className="daily-scroll-panel shrink-0 w-full" style={{
              background: 'linear-gradient(135deg, rgba(180,140,80,0.3), rgba(200,160,60,0.15)), linear-gradient(rgba(223,195,133,0.8), rgba(174,132,72,0.83)), url(\'/ui/parchment-clean-texture.png\')',
              backgroundSize: 'cover',
            }}>
              <div className="scroll-art flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl">💎</div>
                  <div className="text-5xl font-black text-ink mt-2">×4</div>
                </div>
              </div>
              <div className="draw-counter">
                <div className="panel-label"><span />限时活动<b>!</b></div>
                <div className="py-2 text-center">
                  <p className="text-xl font-black text-ink tracking-[0.06em]">签到 4 倍碎片</p>
                  <p className="text-xs text-ink/60 mt-1">活动期间签到奖励翻 4 倍</p>
                </div>
                <p className="text-xs text-jade font-bold">连续 7 天最高可得 1000+ 碎片</p>
                <div className="hero-actions">
                  <Link href="/signin">立即签到</Link>
                  <Link href="/tasks">做任务赚碎片</Link>
                </div>
              </div>
              <div className="reset-seal">🔥 热力</div>
            </div>

            {/* 第3屏：邀请好友活动 */}
            <div className="daily-scroll-panel shrink-0 w-full" style={{
              background: 'linear-gradient(135deg, rgba(45,143,127,0.22), rgba(30,100,90,0.12)), linear-gradient(rgba(210,200,175,0.82), rgba(160,140,110,0.8)), url(\'/ui/parchment-clean-texture.png\')',
              backgroundSize: 'cover',
            }}>
              <div className="scroll-art flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl">👥</div>
                  <div className="text-4xl font-black text-ink mt-2">+5</div>
                </div>
              </div>
              <div className="draw-counter">
                <div className="panel-label"><span />邀请有礼<b>邀</b></div>
                <div className="py-2 text-center">
                  <p className="text-xl font-black text-ink tracking-[0.06em]">邀请好友</p>
                  <p className="text-xs text-ink/60 mt-1">每邀请一位好友</p>
                </div>
                <p className="text-xs text-jade font-bold">赠送 5 次抽卡机会</p>
                <div className="hero-actions">
                  <button onClick={() => {
                    const shareText = '来《国风炼金卡牌》收集历史英雄卡牌！'
                    if (navigator.share) {
                      navigator.share({ title: '国风炼金卡牌', text: shareText, url: window.location.origin })
                    } else {
                      navigator.clipboard?.writeText(shareText + ' ' + window.location.origin)
                    }
                  }}>📤 分享给好友</button>
                  <Link href="/profile">查看邀请记录</Link>
                </div>
              </div>
              <div className="reset-seal">🎁 邀请</div>
            </div>
          </div>

          {/* 指示器 */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => setBannerIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === bannerIndex ? 'w-6 bg-bronze' : 'w-2 bg-bronze/30'
                }`} />
            ))}
          </div>
        </section>

        {/* 收集奖励 */}
        {weeklyRewardConfig && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {weeklyRewardConfig.tiers.map((tier: any, idx: number) => {
              const isUnlocked = collectedCount >= tier.count
              const isClaimed = claimedTiers.includes(idx)
              return <RewardBadge key={idx} count={tier.count} rewardLabel={tier.reward.label}
                isUnlocked={isUnlocked} isClaimed={isClaimed}
                onClick={() => isUnlocked && !isClaimed ? handleClaimWeekly(idx) : undefined} />
            })}
          </div>
        )}

        {/* 六朝主题阶段 */}
        <section className="route-section">
          <div className="ornate-title"><span />六朝主题<span /></div>

          <div className="route-frame">
            {rotationSchedule.map((stage, index) => {
              const display = DYNASTY_DISPLAY[stage.dynasty_tag]
              if (!display) return null
              const pattern = new RegExp(display.cardDynastyPattern)
              const dynastyCards = allCards.filter((c) => pattern.test(c.dynasty))
              const unlocked = dynastyCards.filter((c) => gameState.unlockedCards.includes(c.id)).length
              const total = dynastyCards.length || 12 // 未配置的朝代显示目标12
              const isActive = stage.dynasty_tag === 'qin_han'

              return (
                <div className="route-node" key={stage.dynasty_tag}>
                  <div className={`node-rank ${isActive ? '!bg-bronze' : ''}`}
                       style={isActive ? { backgroundColor: display.color } : {}}>
                    <span style={isActive ? { color: '#f5ead6' } : {}}>{display.icon}</span>
                  </div>
                  <div className="route-card !h-[100px] flex flex-col items-center justify-center"
                       style={{ borderColor: isActive ? display.color : undefined }}>
                    <div className="relative z-10 text-center px-2">
                      <p className="text-sm font-black text-parchment"
                         style={{ fontFamily: 'KaiTi, STKaiti, Georgia, serif' }}>{display.label}</p>
                      <p className="text-[10px] text-bronze/80 mt-1">{display.desc}</p>
                      <p className="text-[10px] text-parchment/60 mt-1">{unlocked}/{total}</p>
                    </div>
                  </div>
                  <p className="node-owned">{isActive ? '🔥 进行中' : '即将开放'}</p>
                  {index < rotationSchedule.length - 1 && <b className="node-arrow">›</b>}
                </div>
              )
            })}
          </div>
        </section>

        {/* 收藏进度 */}
        <section className="collection-panel">
          <div className="ornate-title compact"><span />收藏进度<span /></div>
          <div className="collection-grid">
            {collectionStats.map((item) => (
              <div className="collection-stat" key={item.label}>
                <b>{item.mark}</b><span>{item.label}</span><strong>{item.value}</strong>
              </div>
            ))}
            <Link href="/collection" className="collection-total"><span>藏</span>收集总览</Link>
          </div>
          <div className="runtime-progress"><i style={{ width: `${progressPercent}%` }} /></div>
          <p className="runtime-caption">全量图鉴：{collectionProgress.unlocked}/{FULL_TOTAL}（12 级 · 2,130 张母卡）</p>
        </section>

        {/* 功能卡片 */}
        <section className="action-grid">
          {quickActions.map((action) => (
            <Link className={`feature-card ${action.tone}`} href={action.href} key={action.title}>
              <img src={action.image} alt="" aria-hidden="true" />
              <h2>{action.title}</h2>
              <p>{action.desc}</p>
              <span>{action.cta} ›</span>
            </Link>
          ))}
        </section>
      </div>
    </PageLayout>
  )
}
