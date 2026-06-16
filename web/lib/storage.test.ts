// lib/storage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } })

import {
  loadGameState,
  saveGameState,
  addCardToInventory,
  removeCardFromInventory,
  addRecipeToInventory,
  useRecipe,
  shouldRotateWeek,
  rotateWeek,
} from './storage'
import { INITIAL_GAME_STATE } from './types'

beforeEach(() => {
  localStorageMock.clear()
})

describe('loadGameState', () => {
  it('should return initial state when nothing stored', () => {
    const state = loadGameState()
    expect(state.playerCards).toEqual({})
    expect(state.currentWeeklyDynasty).toBe('qinhan')
  })
})

describe('saveGameState and loadGameState', () => {
  it('should persist and restore state', () => {
    const state = { ...INITIAL_GAME_STATE, totalMerges: 42 }
    saveGameState(state)
    const loaded = loadGameState()
    expect(loaded.totalMerges).toBe(42)
  })
  it('should merge new fields into old saves', () => {
    const oldState = { playerCards: { 'card_a': 3 }, dailyDrawCount: 5 }
    localStorageMock.setItem('alchemy-card-game-state', JSON.stringify(oldState))
    const loaded = loadGameState()
    expect(loaded.playerCards).toEqual({ 'card_a': 3 })
    expect(loaded.currentWeeklyDynasty).toBe('qinhan')
    expect(loaded.ownedRecipes).toEqual([])
  })
})

describe('addCardToInventory', () => {
  it('should increment card count', () => {
    let state = { ...INITIAL_GAME_STATE }
    state = addCardToInventory(state, 'card_a')
    expect(state.playerCards['card_a']).toBe(1)
    state = addCardToInventory(state, 'card_a')
    expect(state.playerCards['card_a']).toBe(2)
  })
  it('should add to unlockedCards on first acquisition', () => {
    let state = { ...INITIAL_GAME_STATE }
    state = addCardToInventory(state, 'card_a')
    expect(state.unlockedCards).toContain('card_a')
    state = addCardToInventory(state, 'card_a')
    expect(state.unlockedCards.filter(id => id === 'card_a')).toHaveLength(1)
  })
})

describe('removeCardFromInventory', () => {
  it('should decrement card count', () => {
    let state = { ...INITIAL_GAME_STATE, playerCards: { 'card_a': 3 } }
    state = removeCardFromInventory(state, 'card_a', 1)
    expect(state.playerCards['card_a']).toBe(2)
  })
  it('should remove card entry when count reaches 0', () => {
    let state = { ...INITIAL_GAME_STATE, playerCards: { 'card_a': 1 } }
    state = removeCardFromInventory(state, 'card_a', 1)
    expect(state.playerCards['card_a']).toBeUndefined()
  })
})

describe('addRecipeToInventory', () => {
  it('should add recipe id', () => {
    let state = { ...INITIAL_GAME_STATE }
    state = addRecipeToInventory(state, 'recipe_chibi')
    expect(state.ownedRecipes).toContain('recipe_chibi')
  })
  it('should not add duplicate', () => {
    let state = { ...INITIAL_GAME_STATE, ownedRecipes: ['recipe_chibi'] }
    state = addRecipeToInventory(state, 'recipe_chibi')
    expect(state.ownedRecipes).toEqual(['recipe_chibi'])
  })
})

describe('useRecipe', () => {
  it('should move recipe from owned to used', () => {
    let state = { ...INITIAL_GAME_STATE, ownedRecipes: ['recipe_chibi'] }
    state = useRecipe(state, 'recipe_chibi')
    expect(state.ownedRecipes).not.toContain('recipe_chibi')
    expect(state.usedRecipes).toContain('recipe_chibi')
  })
})

describe('shouldRotateWeek', () => {
  it('should return true when last rotation was >7 days ago', () => {
    const state = { ...INITIAL_GAME_STATE, lastWeekRotation: Date.now() - 8 * 24 * 60 * 60 * 1000 }
    expect(shouldRotateWeek(state)).toBe(true)
  })
  it('should return false when last rotation was recent', () => {
    const state = { ...INITIAL_GAME_STATE, lastWeekRotation: Date.now() }
    expect(shouldRotateWeek(state)).toBe(false)
  })
})

describe('rotateWeek', () => {
  it('should advance to next dynasty in cycle', () => {
    let state = { ...INITIAL_GAME_STATE, currentWeeklyDynasty: 'qinhan' as const }
    state = rotateWeek(state)
    expect(state.currentWeeklyDynasty).toBe('sanguo')
  })
  it('should wrap from chunqiu to qinhan', () => {
    let state = { ...INITIAL_GAME_STATE, currentWeeklyDynasty: 'chunqiu' as const }
    state = rotateWeek(state)
    expect(state.currentWeeklyDynasty).toBe('qinhan')
  })
})
