'use client'

interface RewardBadgeProps {
  count: number
  rewardLabel: string
  isUnlocked: boolean
  isClaimed: boolean
  onClick?: () => void
}

export function RewardBadge({ count, rewardLabel, isUnlocked, isClaimed, onClick }: RewardBadgeProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked || isClaimed}
      className={`flex flex-col items-center gap-1 p-2 rounded-card border transition-all ${
        isClaimed
          ? 'border-jade/30 bg-jade/10 opacity-60'
          : isUnlocked
          ? 'border-bronze bg-bronze/10 hover:bg-bronze/20 cursor-pointer'
          : 'border-bronze/20 bg-ink-2/50 opacity-50 cursor-not-allowed'
      }`}
    >
      <span className="text-xs font-bold text-paper">{count}张</span>
      <span className="text-[10px] text-paper/60 text-center leading-tight">{rewardLabel}</span>
      {isClaimed && <span className="text-xs text-jade">✅</span>}
      {isUnlocked && !isClaimed && <span className="text-xs text-bronze animate-pulse-slow">🎁</span>}
    </button>
  )
}
