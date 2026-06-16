'use client'

interface TaskItemProps {
  title: string
  description: string
  current: number
  target: number
  rewardLabel: string
  isComplete: boolean
  isClaimed: boolean
  onClaim: () => void
  onGoAction?: () => void
}

export function TaskItem({
  title,
  description,
  current,
  target,
  rewardLabel,
  isComplete,
  isClaimed,
  onClaim,
  onGoAction,
}: TaskItemProps) {
  const progress = Math.min((current / target) * 100, 100)

  return (
    <div className="archive-panel p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-paper text-sm truncate">{title}</h3>
          <p className="text-xs text-paper/50 mt-0.5">{description}</p>
        </div>
        <span className="shrink-0 text-xs text-bronze font-bold">{rewardLabel}</span>
      </div>

      {/* 进度条 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-paper/50">
          <span>进度</span>
          <span>{Math.min(current, target)}/{target}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 操作按钮 */}
      {isClaimed ? (
        <div className="text-center text-xs text-paper/30 py-1">✅ 已领取</div>
      ) : isComplete ? (
        <button onClick={onClaim} className="seal-button w-full py-2 text-sm font-bold">
          领取奖励
        </button>
      ) : onGoAction ? (
        <button onClick={onGoAction} className="seal-button w-full py-2 text-sm font-bold">
          去完成 ›
        </button>
      ) : (
        <div className="text-center text-xs text-paper/40 py-1">进行中...</div>
      )}
    </div>
  )
}
