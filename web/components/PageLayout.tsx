'use client'

import { ReactNode } from 'react'
import { Navigation } from './Navigation'
import { StickyHeader } from './StickyHeader'
import { PageTransition } from './PageTransition'
import { ToastProvider } from './Toast'
import { Skeleton } from './Skeleton'
import { useGame } from '@/lib/gameContext'
import { getTotalCardsOverall } from '@/lib/constants'

export function PageLayout({ children }: { children: ReactNode }) {
  const { gameState, isHydrated } = useGame()

  if (!isHydrated) {
    return <Skeleton />
  }

  const FULL_TOTAL = getTotalCardsOverall()
  const collectedCount = gameState.unlockedCards?.length ?? 0

  return (
    <ToastProvider>
      <main className="min-h-screen pb-20 safe-area-inset">
        {/* 全局吸顶标题栏 — 所有页面统一 */}
        <StickyHeader
          title="国风炼金卡牌"
          subtitle="六朝炼金录"
          collectedCount={collectedCount}
          totalCount={FULL_TOTAL}
        />
        <PageTransition>{children}</PageTransition>
      </main>
      <Navigation />
    </ToastProvider>
  )
}
