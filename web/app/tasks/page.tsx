'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { TaskItem } from '@/components/TaskItem'
import { useGame } from '@/lib/gameContext'
import { claimTaskReward, isTaskComplete, isTaskClaimed } from '@/lib/storage'
import { isLoggedIn, getFragments } from '@/lib/api/game'
import taskDefs from '@/config/tasks.json'
import type { TaskDef } from '@/lib/types'

export default function TasksPage() {
  const { gameState, updateGameState } = useGame()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'daily' | 'achievement'>('daily')

  const dailyTasks = (taskDefs as { daily: TaskDef[] }).daily
  const achievementTasks = (taskDefs as { achievement: TaskDef[] }).achievement
  const currentTasks = activeTab === 'daily' ? dailyTasks : achievementTasks
  const totalFragments = Object.values(gameState.fragments || {}).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (!isLoggedIn()) return
    getFragments().then((frags) => {
      if (frags) {
        updateGameState({ ...gameState, fragments: frags })
      }
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClaim = (task: TaskDef) => {
    updateGameState(claimTaskReward(gameState, task.id, task.reward))
  }

  const handleGoAction = (taskId: string) => {
    switch (taskId) { case 'daily_draw': router.push('/draw'); break; case 'daily_merge': router.push('/merge'); break; default: break }
  }

  const claimable = dailyTasks.filter((t) => isTaskComplete(gameState, t.id, t.target) && !isTaskClaimed(gameState, t.id)).length

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">每日修行</p>
            <h1 className="screen-title">任务</h1>
          </div>
          <Link href="/signin" className="atlas-chip">
            <span className="atlas-medal">签</span>
          </Link>
        </header>

        <section className="daily-scroll-panel">
          <div className="scroll-art">
            <img src="/ui/reference-cauldron.png" alt="任务" />
            <img className="smoke-layer" src="/ui/reference-smoke.png" alt="" aria-hidden="true" />
          </div>
          <div className="draw-counter">
            <div className="panel-label"><span />可领取<b>!</b></div>
            <div className="draw-count"><strong>{claimable}</strong><span>/ {dailyTasks.length}</span></div>
            <p>碎片库存：{totalFragments}</p>
            <div className="hero-actions">
              <button onClick={() => setActiveTab('daily')} className={activeTab === 'daily' ? '!bg-bronze !text-ink' : ''}>每日任务</button>
              <button onClick={() => setActiveTab('achievement')} className={activeTab === 'achievement' ? '!bg-bronze !text-ink' : ''}>成就任务</button>
            </div>
          </div>
          <div className="reset-seal">每日重置</div>
        </section>

        <div className="mt-4">
          <div className="bronze-panel text-center py-3 px-4">
            <span className="text-xl mr-2">💎</span>
            <span className="text-xs text-parchment/60">碎片库存</span>
            <span className="ml-2 text-lg font-bold text-parchment">{totalFragments}</span>
          </div>
        </div>

        <section className="mt-5">
          <div className="ornate-title compact mb-3">
            <span />{activeTab === 'daily' ? '每日任务' : '成就任务'}<span />
          </div>
          <div className="space-y-3">
            {currentTasks.map((task) => {
              const complete = isTaskComplete(gameState, task.id, task.target)
              const claimed = isTaskClaimed(gameState, task.id)
              const progress = gameState.taskProgress?.[task.id]?.current || 0
              return <TaskItem key={task.id} title={task.title} description={task.description} current={progress} target={task.target}
                rewardLabel={task.reward.label} isComplete={complete} isClaimed={claimed}
                onClaim={() => handleClaim(task)}
                onGoAction={!complete && activeTab === 'daily' ? () => handleGoAction(task.id) : undefined} />
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
