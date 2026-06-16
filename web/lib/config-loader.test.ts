// lib/config-loader.test.ts
import { describe, it, expect } from 'vitest'
import {
  loadDynasties,
  getDynastyById,
  loadCardsByDynasty,
  loadAllRecipes,
  getRecipesByDynasty,
  getWeeklyRotation,
  getCurrentWeekNumber,
  getCurrentWeeklyDynasty,
} from './config-loader'

describe('loadDynasties', () => {
  it('should return all 6 dynasties', () => {
    const dynasties = loadDynasties()
    expect(dynasties).toHaveLength(6)
    expect(dynasties[0].id).toBe('qinhan')
  })
})

describe('getDynastyById', () => {
  it('should return dynasty metadata', () => {
    const d = getDynastyById('tang')
    expect(d?.name).toBe('唐')
  })
  it('should return undefined for invalid id', () => {
    expect(getDynastyById('invalid' as any)).toBeUndefined()
  })
})

describe('loadCardsByDynasty', () => {
  it('should load cards for qinhan', () => {
    const cards = loadCardsByDynasty('qinhan')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every(c => c.dynasty === 'qinhan')).toBe(true)
  })
  it('should return empty array for dynasty with no cards yet', () => {
    const cards = loadCardsByDynasty('song')
    expect(Array.isArray(cards)).toBe(true)
  })
})

describe('loadAllRecipes', () => {
  it('should return array', () => {
    const recipes = loadAllRecipes()
    expect(Array.isArray(recipes)).toBe(true)
  })
})

describe('getRecipesByDynasty', () => {
  it('should return empty array for any dynasty currently', () => {
    const recipes = getRecipesByDynasty('qinhan')
    expect(Array.isArray(recipes)).toBe(true)
  })
})

describe('getWeeklyRotation', () => {
  it('should return correct dynasty for week 0', () => {
    const d = getWeeklyRotation(0)
    expect(d).toBe('qinhan')
  })
  it('should return correct dynasty for week 5', () => {
    const d = getWeeklyRotation(5)
    expect(d).toBe('chunqiu')
  })
  it('should wrap around at week 6', () => {
    const d = getWeeklyRotation(6)
    expect(d).toBe('qinhan')
  })
})

describe('getCurrentWeekNumber', () => {
  it('should return a positive number', () => {
    const week = getCurrentWeekNumber()
    expect(week).toBeGreaterThan(0)
  })
})

describe('getCurrentWeeklyDynasty', () => {
  it('should return a valid dynasty id', () => {
    const d = getCurrentWeeklyDynasty()
    expect(['qinhan', 'sanguo', 'tang', 'song', 'ming', 'chunqiu']).toContain(d)
  })
})
