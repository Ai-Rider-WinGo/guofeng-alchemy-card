'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GameState, INITIAL_GAME_STATE } from './types'
import { loadGameState, saveGameState, shouldResetDailyCount, resetDailyCount } from './storage'

type GameContextType = {
  gameState: GameState
  updateGameState: (state: GameState) => void
  isHydrated: boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE)
  const [isHydrated, setIsHydrated] = useState(false)

  // 初始化游戏状态
  useEffect(() => {
    const state = loadGameState()

    // 检查是否需要重置每日计数
    let finalState = state
    if (shouldResetDailyCount(state)) {
      finalState = resetDailyCount(state)
      saveGameState(finalState)
    }

    setGameState(finalState)
    setIsHydrated(true)
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
