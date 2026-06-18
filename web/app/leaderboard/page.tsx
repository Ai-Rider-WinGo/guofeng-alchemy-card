'use client'

import Link from 'next/link'
import { PageLayout } from '@/components/PageLayout'
import { DynastyBanner } from '@/components/DynastyBanner'
import { useGame } from '@/lib/gameContext'

const MOCK_RANKINGS = [
    { rank: 1, name: '炼金宗师', cards: 128, merges: 56 },
    { rank: 2, name: '六朝行者', cards: 115, merges: 48 },
    { rank: 3, name: '青铜藏家', cards: 102, merges: 41 },
    { rank: 4, name: '国风少年', cards: 89, merges: 35 },
    { rank: 5, name: '历史学徒', cards: 76, merges: 29 },
  ]

export default function LeaderboardPage() {
  const { gameState } = useGame()

  // 玩家自身数据
  const myCards = gameState.unlockedCards?.length ?? 0
  const myMerges = gameState.totalMerges ?? 0
  const myRank = MOCK_RANKINGS.findIndex(r => myCards >= r.cards) + 1 || MOCK_RANKINGS.length + 1

  return (
    <PageLayout>
      <div className="screen-shell">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">六朝争锋</p>
            <h1 className="screen-title">排行榜</h1>
            <p className="screen-subtitle">炼金之路，谁与争锋</p>
          </div>
        </header>

        <DynastyBanner />

        {/* 排行榜 */}
        <div className="space-y-2">
          {MOCK_RANKINGS.map((player) => (
            <div
              key={player.rank}
              className={`bronze-panel p-3 flex items-center gap-3 ${
                player.rank <= 3 ? 'border-bronze/30' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                player.rank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
                player.rank === 2 ? 'bg-gray-300/20 text-gray-300' :
                player.rank === 3 ? 'bg-orange-400/20 text-orange-400' :
                'bg-parchment/10 text-parchment/50'
              }`}>
                {player.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-parchment">{player.name}</p>
                <p className="text-[10px] text-parchment/50">
                  收藏 {player.cards} 张 · 合成 {player.merges} 次
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 我的排名 */}
        <div className="mt-4">
          <div className="ornate-title compact mb-3"><span />我的排名<span /></div>
          <div className="bronze-panel p-3 flex items-center gap-3 border-gold/50 bg-gold/5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-gold/20 text-gold">
              {myRank <= MOCK_RANKINGS.length ? myRank : '—'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gold">我</p>
              <p className="text-[10px] text-parchment/50">
                收藏 {myCards} 张 · 合成 {myMerges} 次
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gold/60">超越</p>
              <p className="text-sm font-bold text-gold">
                {myRank <= 1 ? '第 1 名' : `前 ${MOCK_RANKINGS.filter(r => r.cards > myCards).length} 名`}
              </p>
            </div>
          </div>
        </div>

        <div className="bronze-panel p-4 mt-4 text-center">
          <p className="text-xs text-parchment/50">
            排名每日更新 · 每周一结算奖励
          </p>
          <p className="text-xs text-parchment/50 mt-1">
            完整排行榜即将上线
          </p>
        </div>

        <Link href="/" className="ghost-button w-full text-center block mt-5">返回首页</Link>
      </div>
    </PageLayout>
  )
}
