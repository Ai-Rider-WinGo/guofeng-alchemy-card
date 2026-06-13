'use client'

import { ReactNode } from 'react'
import { Navigation } from './Navigation'
import { useGame } from '@/lib/gameContext'

export function PageLayout({ children }: { children: ReactNode }) {
  const { isHydrated } = useGame()

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-paper/60">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="min-h-screen pb-20 safe-area-inset">
        {children}
      </main>
      <Navigation />
    </>
  )
}
