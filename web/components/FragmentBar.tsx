'use client'

interface FragmentBarProps {
  cardName: string
  cardId: string
  required: number
  owned: number
  onMerge: () => void
}

export function FragmentBar({ cardName, cardId, required, owned, onMerge }: FragmentBarProps) {
  const progress = Math.min((owned / required) * 100, 100)
  const canMerge = owned >= required

  return (
    <div className="card-frame p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-paper text-sm">{cardName}</h3>
          <p className="text-xs text-paper/40">{cardId}</p>
        </div>
        <span className={`text-sm font-bold ${canMerge ? 'text-jade' : 'text-paper/50'}`}>
          {owned}/{required}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            canMerge
              ? 'bg-gradient-to-r from-jade to-bronze'
              : 'bg-gradient-to-r from-bronze/40 to-bronze/20'
          }`}
          style={{ width: `${Math.max(progress, 3)}%` }}
        />
      </div>

      <button
        onClick={onMerge}
        disabled={!canMerge}
        className={`w-full py-2 rounded-card text-sm font-bold transition-all ${
          canMerge
            ? 'btn-primary'
            : 'bg-paper/10 text-paper/30 cursor-not-allowed'
        }`}
      >
        {canMerge ? `合成 · 消耗 ${required} 碎片` : `碎片不足 (还需 ${required - owned})`}
      </button>
    </div>
  )
}
