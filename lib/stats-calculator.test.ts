import { describe, it, expect } from 'vitest'
import {
  calculateBaseStats,
  detectAndApplyExtremePenalty,
  calculateDiversity,
  applyDiversityBonus,
  determineCharacterType,
  evaluateSeason,
} from './stats-calculator'
import type { DailyRecord } from './types'

describe('Stats Calculator - Phase 1', () => {
  describe('케이스 1: 극단화 (번아웃)', () => {
    const records: DailyRecord[] = [
      // 14일 모두 집중만 20회
      ...Array.from({ length: 14 }, (_, i) => ({
        date: `2026-06-${String(i + 1).padStart(2, '0')}`,
        focusCount: 20,
        exerciseCount: 0,
        restCount: 1,
        sleepCount: 1,
        pauseCount: 2,
        isConsecutive: i < 13, // 처음 13일은 연속
      })),
    ]

    it('기본 능력치 계산', () => {
      const stats = calculateBaseStats(records)

      // 지식 = 20 * 6 * 14 = 1680 -> 100 (캡)
      expect(stats.knowledge).toBe(100)

      // 집중력 = 20 * 4 * 14 - 2 * 8 * 14 = 1120 - 224 = 896 -> 100 (캡)
      expect(stats.concentration).toBeLessThanOrEqual(100)
      expect(stats.concentration).toBeGreaterThan(50)

      // 체력 = (0 * 8 + 1 * 3 + 1 * 2) * 14 = 5 * 14 = 70
      expect(stats.stamina).toBe(70)

      // 스트레스 = 2 * 5 * 14 - 1 * 2 * 14 - 1 * 1 * 14 = 140 - 28 - 14 = 98 -> 100 (캡)
      expect(stats.stress).toBe(100)
    })

    it('극단화 감지 및 페널티', () => {
      let stats = calculateBaseStats(records)
      stats = detectAndApplyExtremePenalty(stats)

      // 극단화 페널티 적용됨
      expect(stats.stress).toBeGreaterThan(70)
    })

    it('다양성 지표', () => {
      const diversity = calculateDiversity(records)
      expect(diversity).toBe('concentrated') // 1-2개 태그만
    })

    it('최종 평가 결과', () => {
      const result = evaluateSeason(records)

      expect(result.grade).toBe('burnout')
      expect(result.characterType).toBe('sleeper')
      expect(result.nextSeasonBonus.focus).toBe(-50)
    })
  })

  describe('케이스 2: 균형있는 플레이', () => {
    const records: DailyRecord[] = [
      // 균형있게 다양한 활동
      ...Array.from({ length: 14 }, (_, i) => ({
        date: `2026-06-${String(i + 1).padStart(2, '0')}`,
        focusCount: 8,
        exerciseCount: 4,
        restCount: 6,
        sleepCount: 7,
        pauseCount: 1,
        isConsecutive: true,
      })),
    ]

    it('기본 능력치 계산', () => {
      const stats = calculateBaseStats(records)

      expect(stats.knowledge).toBeGreaterThan(40)
      expect(stats.concentration).toBeGreaterThan(30)
      expect(stats.stamina).toBeGreaterThan(60)
      expect(stats.empathy).toBeGreaterThan(40)
      expect(stats.regularity).toBeGreaterThan(30)
    })

    it('다양성 지표', () => {
      const diversity = calculateDiversity(records)
      expect(diversity).toBe('widespread') // 4개 태그 모두
    })

    it('다양성 보너스', () => {
      let stats = calculateBaseStats(records)
      stats = detectAndApplyExtremePenalty(stats)
      const diversity = calculateDiversity(records)
      const statsWithBonus = applyDiversityBonus(stats, diversity)

      // 보너스 적용됨 (+20)
      expect(statsWithBonus.knowledge).toBeGreaterThan(stats.knowledge)
    })

    it('최종 평가 결과', () => {
      const result = evaluateSeason(records)

      expect(result.grade).toBe('harmonious-sage')
      expect(result.characterType).toBe('royal')
      expect(result.nextSeasonBonus.focus).toBe(12)
    })
  })

  describe('케이스 3: 최고 목표 (프린세스)', () => {
    const records: DailyRecord[] = [
      // 완벽한 균형
      ...Array.from({ length: 14 }, (_, i) => ({
        date: `2026-06-${String(i + 1).padStart(2, '0')}`,
        focusCount: 10,
        exerciseCount: 6,
        restCount: 8,
        sleepCount: 8,
        pauseCount: 0,
        isConsecutive: true,
      })),
    ]

    it('기본 능력치 계산', () => {
      const stats = calculateBaseStats(records)

      expect(stats.knowledge).toBeGreaterThanOrEqual(60)
      expect(stats.concentration).toBeGreaterThanOrEqual(40)
      expect(stats.stamina).toBeGreaterThanOrEqual(80)
      expect(stats.empathy).toBeGreaterThanOrEqual(50)
      expect(stats.regularity).toBeGreaterThanOrEqual(40)
      expect(stats.stress).toBeLessThanOrEqual(20)
    })

    it('극단화 감지 안 됨', () => {
      const stats = calculateBaseStats(records)
      const statsAfterPenalty = detectAndApplyExtremePenalty(stats)

      // 페널티 없음
      expect(statsAfterPenalty).toEqual(stats)
    })

    it('최종 평가 결과', () => {
      const result = evaluateSeason(records)

      expect(result.grade).toBe('princess')
      expect(result.nextSeasonBonus.focus).toBe(20)
    })
  })

  describe('엣지 케이스', () => {
    it('거의 활동 없음', () => {
      const records: DailyRecord[] = Array.from({ length: 14 }, (_, i) => ({
        date: `2026-06-${String(i + 1).padStart(2, '0')}`,
        focusCount: i === 0 ? 1 : 0,
        exerciseCount: 0,
        restCount: 1,
        sleepCount: 1,
        pauseCount: 0,
        isConsecutive: false,
      }))

      const result = evaluateSeason(records)
      expect(result.stats.knowledge).toBeLessThan(20)
    })

    it('연속 출석 보상', () => {
      const records: DailyRecord[] = Array.from({ length: 14 }, (_, i) => ({
        date: `2026-06-${String(i + 1).padStart(2, '0')}`,
        focusCount: 1,
        exerciseCount: 0,
        restCount: 0,
        sleepCount: 0,
        pauseCount: 0,
        isConsecutive: true,
      }))

      const stats = calculateBaseStats(records)
      expect(stats.regularity).toBe(42) // 14 * 3
    })
  })
})
