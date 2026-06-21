'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GameState, INITIAL_GAME_STATE } from './types'
import { loadGameState, saveGameState, shouldResetDailyCount, resetDailyCount } from './storage'
import { initGameData } from './config-loader'
import { isLoggedIn, getInventory, getCollection, getFragments } from './api/game'

type GameContextType = {
  gameState: GameState
  updateGameState: (state: GameState) => void
  isHydrated: boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      // 1. 卡牌目录（失败回退静态 JSON）
      await initGameData()

      // 2. 读本地存档
      let state = loadGameState()
      if (shouldResetDailyCount(state)) {
        state = resetDailyCount(state)
        saveGameState(state)
      }

      // 3. 登录态：从后端水合玩家态（inventory/collection/fragments）
      if (isLoggedIn()) {
        try {
          const [inv, col, frags] = await Promise.all([
            getInventory(),
            getCollection(),
            getFragments(),
          ])
          // 后端 inventory → playerCards map
          const playerCards: Record<string, number> = {}
          for (const row of inv) {
            playerCards[row.card_id] = row.quantity
          }
          // 合并：后端权威，但保留本地未同步的字段（signIn/tasks 等）
          state = {
            ...state,
            playerCards,
            unlockedCards: Array.from(new Set([...(col.unlocked || []), ...state.unlockedCards])),
            fragments: frags || {},
          }
          saveGameState(state)
        } catch (e) {
          // 水合失败，用本地存档兜底
          console.warn('远端水合失败，使用本地存档:', e)
        }
      }

      if (cancelled) return
      setGameState(state)
      setIsHydrated(true)
    }
    bootstrap()
    return () => { cancelled = true }
  }, [])

  const updateGameState = (state: GameState) => {
    setGameState(state)
    saveGameState(state)
  }

  return (
    <GameContext.Provider value={{ gameState, updateGameState, isHydrated }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}
