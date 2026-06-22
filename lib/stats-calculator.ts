import type { DailyRecord, Stats, Diversity, EvaluationResult, CharacterType, EvaluationGrade } from './types'

const STATS_CAP = 100
const STATS_MIN = 0

// 1단계: 기본 능력치 계산
export function calculateBaseStats(dailyRecords: DailyRecord[]): Stats {
  let knowledge = 0
  let concentration = 0
  let stamina = 0
  let empathy = 0
  let regularity = 0
  let stress = 0

  for (const record of dailyRecords) {
    // 지식 = (집중 횟수 × 6)
    knowledge += record.focusCount * 6

    // 집중력 = (집중 횟수 완료 × 4) + (중단 × -8)
    concentration += record.focusCount * 4
    concentration -= record.pauseCount * 8

    // 체력 = (운동 × 8) + (휴식 × 3) + (잠 × 2)
    stamina += record.exerciseCount * 8
    stamina += record.restCount * 3
    stamina += record.sleepCount * 2

    // 감성 = (휴식 × 5) + (잠 × 2)
    empathy += record.restCount * 5
    empathy += record.sleepCount * 2

    // 규칙성 = (연속 출석 일수 × 3)
    if (record.isConsecutive) {
      regularity += 3
    }

    // 스트레스 = (중단 × 5) - (휴식 × 2) - (잠 × 1)
    stress += record.pauseCount * 5
    stress -= record.restCount * 2
    stress -= record.sleepCount * 1
  }

  // 값 정규화 (0-100)
  return {
    knowledge: Math.min(knowledge, STATS_CAP),
    concentration: Math.max(Math.min(concentration, STATS_CAP), STATS_MIN),
    stamina: Math.min(stamina, STATS_CAP),
    empathy: Math.min(empathy, STATS_CAP),
    regularity: Math.min(regularity, STATS_CAP),
    stress: Math.max(Math.min(stress, STATS_CAP), STATS_MIN),
  }
}

// 2단계: 극단화 감지 및 페널티
export function detectAndApplyExtremePenalty(stats: Stats): Stats {
  const statValues = Object.entries(stats)
    .filter(([key]) => key !== 'stress')
    .map(([, value]) => value)

  const maxStat = Math.max(...statValues)
  const nonMaxStats = statValues.filter((v) => v !== maxStat)

  // 극단화 조건 1: 한 능력 70+ AND 나머지 모두 30 이하
  const condition1 =
    maxStat >= 70 && nonMaxStats.every((stat) => stat <= 30)

  // 극단화 조건 2: 한 능력 75+ AND 나머지 하나만 40-50, 나머지 30 이하
  const condition2 =
    maxStat >= 75 &&
    nonMaxStats.filter((stat) => stat >= 40 && stat <= 50).length === 1 &&
    nonMaxStats.filter((stat) => stat <= 30).length === nonMaxStats.length - 1

  if (!condition1 && !condition2) {
    return stats
  }

  // 극단화 페널티 적용
  const penaltyStats = { ...stats }

  // 최고 능력치 찾기
  const maxKey = Object.entries(stats)
    .filter(([key]) => key !== 'stress')
    .sort(([, a], [, b]) => b - a)[0][0] as keyof Stats

  // 최고 능력치 -30
  if (maxKey !== 'stress') {
    penaltyStats[maxKey] = Math.max(penaltyStats[maxKey] - 30, STATS_MIN)
  }

  // 스트레스 +25
  penaltyStats.stress = Math.min(penaltyStats.stress + 25, STATS_CAP)

  return penaltyStats
}

// 3단계: 다양성 지표 계산
export function calculateDiversity(dailyRecords: DailyRecord[]): Diversity {
  const tagsUsed = new Set<string>()

  for (const record of dailyRecords) {
    if (record.focusCount > 0) tagsUsed.add('focus')
    if (record.exerciseCount > 0) tagsUsed.add('exercise')
    if (record.restCount > 0) tagsUsed.add('rest')
    if (record.sleepCount > 0) tagsUsed.add('sleep')
  }

  const uniqueTags = tagsUsed.size

  if (uniqueTags === 4) return 'widespread'
  if (uniqueTags === 3) return 'standard'
  return 'concentrated'
}

// 3단계: 다양성 보너스 적용
export function applyDiversityBonus(stats: Stats, diversity: Diversity): Stats {
  const bonusStats = { ...stats }

  if (diversity === 'widespread') {
    // 4개 태그 모두: 모든 능력치 +20
    bonusStats.knowledge = Math.min(bonusStats.knowledge + 20, STATS_CAP)
    bonusStats.concentration = Math.min(bonusStats.concentration + 20, STATS_CAP)
    bonusStats.stamina = Math.min(bonusStats.stamina + 20, STATS_CAP)
    bonusStats.empathy = Math.min(bonusStats.empathy + 20, STATS_CAP)
    bonusStats.regularity = Math.min(bonusStats.regularity + 20, STATS_CAP)
  } else if (diversity === 'concentrated') {
    // 1-2개 태그만: 최고 능력치 -15 추가
    const maxKey = Object.entries(bonusStats)
      .filter(([key]) => key !== 'stress')
      .sort(([, a], [, b]) => b - a)[0][0] as keyof Stats

    if (maxKey !== 'stress') {
      bonusStats[maxKey] = Math.max(bonusStats[maxKey] - 15, STATS_MIN)
    }
  }

  return bonusStats
}

// 4단계: 캐릭터 타입 결정
export function determineCharacterType(stats: Stats): CharacterType {
  const { knowledge, concentration, stamina, empathy, regularity, stress } = stats

  // 평가 등급 결정
  const grade = determineGrade(stats)

  // 등급별로 타입 결정
  switch (grade) {
    case 'princess':
    case 'harmonious-sage':
      // 균형 잘 잡힌 경우 -> 왕견
      return 'royal'

    case 'scholar':
      // 지식 높음 -> 학자견
      return 'scholar'

    case 'athlete':
      // 체력 높음 -> 탐험견
      return 'explorer'

    case 'healer':
      // 감성 높음 -> 치유견
      return 'healer'

    case 'burnout':
      // 번아웃 -> 밤샤수견 (극도로 피곤한 상태)
      return 'sleeper'

    default:
      return 'royal' // 기본값
  }
}

// 4단계: 평가 등급 결정
function determineGrade(stats: Stats): EvaluationGrade {
  const { knowledge, concentration, stamina, empathy, regularity, stress } = stats

  // 프린세스: 모든 능력 ≥50, 스트레스 <20
  if (
    knowledge >= 50 &&
    concentration >= 50 &&
    stamina >= 50 &&
    empathy >= 50 &&
    regularity >= 50 &&
    stress < 20
  ) {
    return 'princess'
  }

  // 조화로운 현인: 3개 이상 능력 ≥45, 스트레스 <30
  const statsAbove45 = [
    knowledge >= 45,
    concentration >= 45,
    stamina >= 45,
    empathy >= 45,
    regularity >= 45,
  ].filter(Boolean).length

  if (statsAbove45 >= 3 && stress < 30) {
    return 'harmonious-sage'
  }

  // 번아웃: 한 능력 ≥70 + 나머지 ≤30, 스트레스 ≥70
  const allStats = [knowledge, concentration, stamina, empathy, regularity]
  const maxStat = Math.max(...allStats)
  const minStats = allStats.filter((s) => s <= 30)

  if (maxStat >= 70 && minStats.length >= 3 && stress >= 70) {
    return 'burnout'
  }

  // 학자: 지식 ≥60, 집중력 ≥50
  if (knowledge >= 60 && concentration >= 50) {
    return 'scholar'
  }

  // 스포츠맨: 체력 ≥65, 규칙성 ≥50
  if (stamina >= 65 && regularity >= 50) {
    return 'athlete'
  }

  // 치유사: 감성 ≥60, 체력 ≥45
  if (empathy >= 60 && stamina >= 45) {
    return 'healer'
  }

  // 기본값
  return 'harmonious-sage'
}

// 다음 시즌 보너스 계산
export function calculateNextSeasonBonus(
  grade: EvaluationGrade
): { [key: string]: number } {
  const bonuses: { [key: string]: number } = {}

  switch (grade) {
    case 'princess':
      return {
        focus: 20,
        exercise: 20,
        rest: 20,
        sleep: 20,
      }

    case 'harmonious-sage':
      return {
        focus: 12,
        exercise: 12,
        rest: 12,
        sleep: 12,
      }

    case 'scholar':
      return {
        focus: 15,
      }

    case 'athlete':
      return {
        exercise: 15,
      }

    case 'healer':
      return {
        rest: 12,
      }

    case 'burnout':
      return {
        focus: -50,
        exercise: -50,
        rest: -50,
        sleep: -50,
      }

    default:
      return {}
  }
}

// 전체 평가 실행
export function evaluateSeason(dailyRecords: DailyRecord[]): EvaluationResult {
  // 1단계: 기본 능력치 계산
  let stats = calculateBaseStats(dailyRecords)

  // 2단계: 극단화 감지 및 페널티
  stats = detectAndApplyExtremePenalty(stats)

  // 3단계: 다양성 지표 계산
  const diversity = calculateDiversity(dailyRecords)

  // 3단계: 다양성 보너스 적용
  stats = applyDiversityBonus(stats, diversity)

  // 4단계: 평가 등급 결정
  const grade = determineGrade(stats)

  // 캐릭터 타입 결정
  const characterType = determineCharacterType(stats)

  // 다음 시즌 보너스
  const nextSeasonBonus = calculateNextSeasonBonus(grade)

  // 주요 태그 결정
  const primaryTags: string[] = []
  let maxCount = 0
  for (const record of dailyRecords) {
    if (record.focusCount > maxCount) {
      maxCount = record.focusCount
      primaryTags.length = 0
      if (maxCount > 0) primaryTags.push('focus')
    } else if (record.focusCount === maxCount && maxCount > 0) {
      primaryTags.push('focus')
    }

    if (record.exerciseCount > maxCount) {
      maxCount = record.exerciseCount
      primaryTags.length = 0
      if (maxCount > 0) primaryTags.push('exercise')
    }

    if (record.restCount > maxCount) {
      maxCount = record.restCount
      primaryTags.length = 0
      if (maxCount > 0) primaryTags.push('rest')
    }

    if (record.sleepCount > maxCount) {
      maxCount = record.sleepCount
      primaryTags.length = 0
      if (maxCount > 0) primaryTags.push('sleep')
    }
  }

  return {
    grade,
    characterType,
    diversity,
    stats,
    primaryTags: primaryTags as any,
    nextSeasonBonus,
  }
}
