import { describe, it, expect } from 'vitest'
import {
  CARD_QUALITY,
  DYNASTY_IDS,
  isValidLevel,
  getQualityByLevel,
  getFragmentCost,
  getSuccessRate,
  isLv12SynthesisEligible,
} from './types'

describe('CardQuality', () => {
  it('should have 6 quality tiers mapping to level ranges', () => {
    expect(CARD_QUALITY.common).toEqual({ name: '凡品', levelRange: [1, 2] })
    expect(CARD_QUALITY.fine).toEqual({ name: '精良', levelRange: [3, 5] })
    expect(CARD_QUALITY.rare).toEqual({ name: '稀有', levelRange: [6, 7] })
    expect(CARD_QUALITY.epic).toEqual({ name: '极品', levelRange: [8, 9] })
    expect(CARD_QUALITY.divine).toEqual({ name: '神品', levelRange: [10, 11] })
    expect(CARD_QUALITY.treasure).toEqual({ name: '至宝', levelRange: [12, 12] })
  })
})

describe('getQualityByLevel', () => {
  it('should map level 1-2 to common', () => {
    expect(getQualityByLevel(1)).toBe('common')
    expect(getQualityByLevel(2)).toBe('common')
  })
  it('should map level 3-5 to fine', () => {
    expect(getQualityByLevel(3)).toBe('fine')
    expect(getQualityByLevel(5)).toBe('fine')
  })
  it('should map level 6-7 to rare', () => {
    expect(getQualityByLevel(6)).toBe('rare')
    expect(getQualityByLevel(7)).toBe('rare')
  })
  it('should map level 8-9 to epic', () => {
    expect(getQualityByLevel(8)).toBe('epic')
    expect(getQualityByLevel(9)).toBe('epic')
  })
  it('should map level 10-11 to divine', () => {
    expect(getQualityByLevel(10)).toBe('divine')
    expect(getQualityByLevel(11)).toBe('divine')
  })
  it('should map level 12 to treasure', () => {
    expect(getQualityByLevel(12)).toBe('treasure')
  })
})

describe('isValidLevel', () => {
  it('should accept 1-12', () => {
    for (let i = 1; i <= 12; i++) {
      expect(isValidLevel(i)).toBe(true)
    }
  })
  it('should reject 0 and 13', () => {
    expect(isValidLevel(0)).toBe(false)
    expect(isValidLevel(13)).toBe(false)
  })
})

describe('getFragmentCost', () => {
  it('should return correct costs per level', () => {
    expect(getFragmentCost(1)).toBe(5)
    expect(getFragmentCost(2)).toBe(10)
    expect(getFragmentCost(3)).toBe(15)
    expect(getFragmentCost(4)).toBe(30)
    expect(getFragmentCost(5)).toBe(50)
    expect(getFragmentCost(6)).toBe(80)
    expect(getFragmentCost(7)).toBe(120)
    expect(getFragmentCost(8)).toBe(180)
    expect(getFragmentCost(9)).toBe(250)
    expect(getFragmentCost(10)).toBe(350)
    expect(getFragmentCost(11)).toBe(500)
    expect(getFragmentCost(12)).toBe(800)
  })
})

describe('getSuccessRate', () => {
  it('should return 1.0 for levels 1-5', () => {
    expect(getSuccessRate(1)).toBe(1.0)
    expect(getSuccessRate(5)).toBe(1.0)
  })
  it('should return 0.8 for levels 6-8', () => {
    expect(getSuccessRate(6)).toBe(0.8)
    expect(getSuccessRate(8)).toBe(0.8)
  })
  it('should return 0.6 for levels 9-11', () => {
    expect(getSuccessRate(9)).toBe(0.6)
    expect(getSuccessRate(11)).toBe(0.6)
  })
  it('should return 0 for level 12', () => {
    expect(getSuccessRate(12)).toBe(0)
  })
})

describe('isLv12SynthesisEligible', () => {
  it('should require exactly 6 cards', () => {
    expect(isLv12SynthesisEligible(['a', 'b', 'c', 'd', 'e'])).toBe(false)
    expect(isLv12SynthesisEligible(['a', 'b', 'c', 'd', 'e', 'f'])).toBe(true)
    expect(isLv12SynthesisEligible(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBe(false)
  })
})

describe('DYNASTY_IDS', () => {
  it('should have exactly 6 dynasties', () => {
    expect(DYNASTY_IDS).toHaveLength(6)
  })
  it('should include all expected dynasties', () => {
    expect(DYNASTY_IDS).toContain('qinhan')
    expect(DYNASTY_IDS).toContain('sanguo')
    expect(DYNASTY_IDS).toContain('tang')
    expect(DYNASTY_IDS).toContain('song')
    expect(DYNASTY_IDS).toContain('ming')
    expect(DYNASTY_IDS).toContain('chunqiu')
  })
})
