'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { BannerCarousel, type BannerItem } from '@/components/BannerCarousel'
import { AlchemyFurnace } from '@/components/AlchemyFurnace'
import { useToast } from '@/components/Toast'
import { RewardBadge } from '@/components/RewardBadge'
import { useGame } from '@/lib/gameContext'
import { loadCards, loadDrawPools } from '@/lib/cardUtils'
import { getCollectionProgress, getRemainingDraws, updateWeeklyCollectionProgress, claimWeeklyReward } from '@/lib/storage'
import { DYNASTY_META } from '@/lib/types'
import { WEEKLY_DYNASTY_ORDER } from '@/lib/constants'
import weeklyRewardsData from '@/config/weekly_collection_rewards.json'

// 朝代标签 → 展示信息
const DYNASTY_DISPLAY: Record<string, { label: string; desc: string; icon: string; bgClass: string; borderClass: string; cardDynastyPattern: string }> = {
  qin_han:  { label: '秦月汉关', desc: '楚汉争霸', icon: '🏯', bgClass: 'bg-dynasty-qinhan', borderClass: 'border-dynasty-qinhan', cardDynastyPattern: '秦汉|汉初' },
  tang:     { label: '盛唐气象', desc: '万国来朝', icon: '🏰', bgClass: 'bg-dynasty-tang', borderClass: 'border-dynasty-tang', cardDynastyPattern: '唐' },
  song:     { label: '大宋风华', desc: '文治天下', icon: '🏛️', bgClass: 'bg-dynasty-song', borderClass: 'border-dynasty-song', cardDynastyPattern: '宋' },
  ming:     { label: '大明雄风', desc: '七下西洋', icon: '⛩️', bgClass: 'bg-dynasty-ming', borderClass: 'border-dynasty-ming', cardDynastyPattern: '明' },
  three_kingdoms: { label: '三国争霸', desc: '群雄逐鹿', icon: '⚔️', bgClass: 'bg-dynasty-sanguo', borderClass: 'border-dynasty-sanguo', cardDynastyPattern: '三国' },
  spring_autumn_warring_states: { label: '春秋战国', desc: '百家争鸣', icon: '📜', bgClass: 'bg-dynasty-chunqiu', borderClass: 'border-dynasty-chunqiu', cardDynastyPattern: '春秋|战国' },
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

/** 运营 Banner 数据 — 后续可从配置/后端拉取 */
const HOME_BANNERS: BannerItem[] = [
  {
    id: 'double_weekend',
    type: 'event',
    icon: '🔥',
    title: '周末双倍碎片活动',
    subtitle: '本周五六日抽卡碎片掉落翻倍，速来炼金',
    link: '/draw',
  },
  {
    id: 'new_pool_qinhan',
    type: 'new_pool',
    icon: '🏯',
    title: '秦汉卡池全新上线',
    subtitle: '刘邦、项羽、韩信等传奇人物等你收集',
    link: '/draw',
  },
  {
    id: 'collab_coming',
    type: 'limited',
    icon: '✨',
    title: '限定至宝即将登场',
    subtitle: '集齐6张Lv11即可炼成第一张至宝金卡',
    link: '/merge',
  },
]

export default function HomePage() {
  const { gameState, updateGameState } = useGame()
  const { showToast } = useToast()
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
    showToast(`领取成功：${tier.reward.label}`, 'reward', '🎁')
  }

  // 倒计时（周几重置）
  const now = new Date()
  const daysUntilSunday = 7 - now.getDay()
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday))
  weekEnd.setHours(23, 59, 59)
  const resetDay = ['日', '一', '二', '三', '四', '五', '六'][weekEnd.getDay()]

  const currentDynasty = gameState.currentWeeklyDynasty
  const dynMeta = DYNASTY_META[currentDynasty]
  const nextIndex = (WEEKLY_DYNASTY_ORDER.indexOf(currentDynasty) + 1) % 6
  const nextDynasty = WEEKLY_DYNASTY_ORDER[nextIndex]

  return (
    <PageLayout>
      <div className="home-shell bg-gradient-to-b from-background via-[#0a0908] to-void-100">
        {/* ====== Signature：炼金炉 ====== */}
        <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
          <AlchemyFurnace />
        </div>

        {/* ====== 运营 Banner 轮播 ====== */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <BannerCarousel banners={HOME_BANNERS} />
        </div>

        {/* ====== 朝代主视觉大卡 ====== */}
        <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="hero-visual p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-gold/50 tracking-[0.2em]">当前朝代</p>
              <h2 className="text-2xl font-black text-gold font-display">{dynMeta.name}</h2>
              <p className="text-[11px] text-text-secondary">{dynMeta.period}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-muted">下周预告</p>
              <p className="text-sm text-gold/70">{DYNASTY_META[nextDynasty].name}</p>
            </div>
          </div>
          {/* 六朝进度条 */}
          <div className="flex gap-1.5 mb-3">
            {WEEKLY_DYNASTY_ORDER.map((d, i) => {
              const meta = DYNASTY_META[d]
              const isCurrent = i === WEEKLY_DYNASTY_ORDER.indexOf(currentDynasty)
              const isPast = i < WEEKLY_DYNASTY_ORDER.indexOf(currentDynasty)
              return (
                <div key={d} className="flex-1 text-center">
                  <div className={`h-1.5 rounded-full mb-1 transition-all ${
                    isCurrent ? 'bg-gold' : isPast ? 'bg-gold/30' : 'bg-gold/10'
                  }`} />
                  <span className={`text-[9px] ${isCurrent ? 'text-gold font-bold' : 'text-text-muted'}`}>
                    {meta.name}
                  </span>
                </div>
              )
            })}
          </div>
          {/* 收藏进度 */}
          <div className="flex items-center gap-2 text-[11px] text-text-secondary">
            <span>🏛️ 朝代收藏</span>
            <div className="flex-1 h-1 bg-void-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-bronze-green to-gold rounded-full transition-all"
                   style={{ width: `${Math.min(100, (collectionProgress.unlocked / FULL_TOTAL) * 100)}%` }} />
            </div>
            <span className="text-gold font-bold">{collectionProgress.unlocked}/{FULL_TOTAL}</span>
          </div>
        </div>
        </div>

        {/* ====== 两大主入口 ====== */}
        <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* 命运抽卡 */}
          <Link href="/draw" className="hero-visual p-4 text-center group cursor-pointer block">
            <div className="text-4xl mb-2 group-active:scale-90 transition-transform">🎴</div>
            <h3 className="text-lg font-black text-gold font-display">命运抽卡</h3>
            <p className="text-[10px] text-text-secondary mt-1">今日剩余 {remainingDraws} 次</p>
            <div className="mt-2 inline-block px-3 py-1 rounded-lg border border-gold/30 text-[10px] text-gold/80 font-bold">
              前往抽卡
            </div>
          </Link>
          {/* 炼金合成 */}
          <Link href="/merge" className="hero-visual p-4 text-center group cursor-pointer block">
            <div className="text-4xl mb-2 group-active:scale-90 transition-transform">⚗️</div>
            <h3 className="text-lg font-black text-gold font-display">炼金合成</h3>
            <p className="text-[10px] text-text-secondary mt-1">已合成 {gameState.totalMerges} 次</p>
            <div className="mt-2 inline-block px-3 py-1 rounded-lg border border-gold/30 text-[10px] text-gold/80 font-bold">
              前往合成
            </div>
          </Link>
        </div>
        </div>

        {/* ====== 至宝目标 ====== */}
        <div className="animate-slide-up" style={{ animationDelay: '800ms' }}>
        <div className="gold-panel p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gold">👑 至宝目标</h3>
            <span className="text-[10px] text-text-muted">集齐12张至宝 · 兑换1g黄金实体卡</span>
          </div>
          <div className="flex gap-1 justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`treasure-slot ${i < gameState.ultimateCards.length ? 'owned' : ''}`}>
                {i < gameState.ultimateCards.length ? (
                  <span className="text-gold text-xs">★</span>
                ) : (
                  <span className="text-gold/15 text-[10px]">{i + 1}</span>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gold/40">
              {gameState.ultimateCards.length === 0
                ? '炼成第一张至宝，开启实体黄金卡之旅'
                : `已炼成 ${gameState.ultimateCards.length}/12 张至宝`
              }
            </span>
          </div>
        </div>
        </div>

        {/* ====== 快捷入口 2×2 ====== */}
        <div className="animate-slide-up" style={{ animationDelay: '1000ms' }}>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { href: '/leaderboard', icon: '🏆', label: '排行' },
            { href: '/gallery', icon: '🏰', label: '炼金阁' },
            { href: '/signin', icon: '🔥', label: '签到' },
            { href: '/tasks', icon: '📋', label: '任务' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 py-2 rounded-lg bg-void-200/50 border border-gold/10 text-[10px] text-text-secondary hover:border-gold/30 transition-colors">
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        </div>

        {/* 收集奖励 */}
        {weeklyRewardConfig && (
          <div className="animate-slide-up" style={{ animationDelay: '1100ms' }}>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {weeklyRewardConfig.tiers.map((tier: any, idx: number) => {
              const isUnlocked = collectedCount >= tier.count
              const isClaimed = claimedTiers.includes(idx)
              return <RewardBadge key={idx} count={tier.count} rewardLabel={tier.reward.label}
                isUnlocked={isUnlocked} isClaimed={isClaimed}
                onClick={() => isUnlocked && !isClaimed ? handleClaimWeekly(idx) : undefined} />
            })}
          </div>
          </div>
        )}

        {/* 六朝主题阶段 */}
        <div className="animate-slide-up" style={{ animationDelay: '1200ms' }}>
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
                  <div className={`node-rank ${isActive ? display.bgClass + ' !bg-opacity-100' : ''}`}>
                    <span className={isActive ? 'text-paper' : ''}>{display.icon}</span>
                  </div>
                  <div className={`route-card !h-[100px] flex flex-col items-center justify-center ${isActive ? display.borderClass : ''}`}>
                    <div className="relative z-10 text-center px-2">
                      <p className="text-sm font-black text-parchment font-display">{display.label}</p>
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
        </div>

        {/* 收藏进度 */}
        <div className="animate-slide-up" style={{ animationDelay: '1400ms' }}>
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
        </div>

        {/* 功能卡片 */}
        <div className="animate-slide-up" style={{ animationDelay: '1600ms' }}>
        <section className="action-grid">
          {quickActions.map((action) => (
            <Link className={`feature-card ${action.tone}`} href={action.href} key={action.title}>
              <img src={action.image} alt="" aria-hidden="true" />
              <h2>{action.title}</h2>
              <p>{action.desc}</p>
              <span>{action.cta}</span>
            </Link>
          ))}
        </section>
        </div>
      </div>
    </PageLayout>
  )
}
