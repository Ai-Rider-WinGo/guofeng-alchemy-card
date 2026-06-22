'use client'

import { ReactNode } from 'react'

/** 页面切换时的淡入上浮过渡包装 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>
}
