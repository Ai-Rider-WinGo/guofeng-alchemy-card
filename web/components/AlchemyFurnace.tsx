'use client'

/**
 * 炼金炉 — 首页签名级视觉组件。
 * 纯展示：炉身 + 火光 + 升腾粒子，点击触发一次"炼金"脉冲反馈。
 * 后续可接入实际抽卡/合成动画。
 */
export function AlchemyFurnace() {
  return (
    <div className="alchemy-furnace" role="img" aria-label="国风炼金炉">
      <div className="alchemy-furnace-glow" aria-hidden />
      <div className="alchemy-furnace-body" aria-hidden>
        {/* 炉口 */}
        <div className="alchemy-furnace-mouth" />
        {/* 炉身纹饰 */}
        <div className="alchemy-furnace-rune">炼</div>
        {/* 火焰 */}
        <div className="alchemy-furnace-flame" />
      </div>
      {/* 升腾粒子 */}
      <div className="alchemy-furnace-particles" aria-hidden>
        <span style={{ '--i': 0 } as React.CSSProperties} />
        <span style={{ '--i': 1 } as React.CSSProperties} />
        <span style={{ '--i': 2 } as React.CSSProperties} />
        <span style={{ '--i': 3 } as React.CSSProperties} />
        <span style={{ '--i': 4 } as React.CSSProperties} />
      </div>
      <p className="alchemy-furnace-caption">六朝炼金录 · 炉烟起，卡牌现</p>
    </div>
  )
}
