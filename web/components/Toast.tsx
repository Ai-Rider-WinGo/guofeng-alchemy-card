'use client'

import { createContext, useCallback, useContext, useState, ReactNode, useMemo } from 'react'

type ToastType = 'info' | 'reward' | 'error' | 'success'

interface ToastItem {
  id: number
  message: string
  type: ToastType
  icon: string
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, icon?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TYPE_STYLE: Record<ToastType, string> = {
  info: 'border-primary-100/40 from-[#1a1410] to-[#241c14]',
  reward: 'border-gold-100/60 from-[#2a2114] to-[#3a2c18]',
  error: 'border-red-500/50 from-[#2a1414] to-[#3a1818]',
  success: 'border-emerald-500/50 from-[#142a1c] to-[#183a24]',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', icon = '✦') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type, icon }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item bg-gradient-to-b ${TYPE_STYLE[t.type]} border`}
            role="status"
          >
            <span className="toast-icon">{t.icon}</span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // 在没有 Provider 的场景下提供 no-op 实现，避免页面崩溃
    return { showToast: () => {} }
  }
  return ctx
}
