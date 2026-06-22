// 태그 타입
export type TagType = 'focus' | 'exercise' | 'rest' | 'sleep'

// 능력치
export interface Stats {
  knowledge: number // 지식: 공부, 독서
  concentration: number // 집중력: 포모도로 완료, 중단 적음
  stamina: number // 체력: 운동, 휴식
  empathy: number // 감성: 휴식, 잠
  regularity: number // 규칙성: 연속 출석
  stress: number // 스트레스: 중단, 휴식 부족
}

// 매일의 활동 기록
export interface DailyRecord {
  date: string // YYYY-MM-DD
  focusCount: number // 집중 횟수
  exerciseCount: number // 운동 횟수
  restCount: number // 휴식 횟수
  sleepCount: number // 잠 횟수
  pauseCount: number // 중단 횟수
  isConsecutive: boolean // 연속 출석 여부
}

// 시즌 데이터
export interface SeasonData {
  id: string
  userId: string
  seasonNumber: number // 1, 2, 3, ...
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  dailyRecords: DailyRecord[]
  stats?: Stats // 시즌 종료 후 저장
  characterType?: string // '똑똑한학자견', '창의력예술견', ...
  createdAt: string
  updatedAt: string
}

// 성장 타입
export type CharacterType =
  | 'scholar' // 똑똑한 학자견
  | 'artist' // 창의력 많은 예술견
  | 'explorer' // 활발한 탐험견
  | 'healer' // 따뜻한 치유견
  | 'royal' // 균형잡힌 왕견
  | 'sleeper' // 밤샤수견

// 평가 등급
export type EvaluationGrade =
  | 'princess' // ⭐⭐⭐⭐⭐ 최고
  | 'harmonious-sage' // ⭐⭐⭐⭐ 높음
  | 'scholar' // ⭐⭐⭐ 중상
  | 'athlete' // ⭐⭐⭐ 중상
  | 'healer' // ⭐⭐⭐ 중상
  | 'burnout' // ⭐ 최악

// 다양성 지표
export type Diversity = 'widespread' | 'standard' | 'concentrated'

// 평가 결과
export interface EvaluationResult {
  grade: EvaluationGrade
  characterType: CharacterType
  diversity: Diversity
  stats: Stats
  primaryTags: TagType[]
  dangerousStat?: keyof Stats
  nextSeasonBonus: {
    [key in TagType]?: number // 보너스 %
  }
}

// 테스트 모드 설정
export interface TimeConfig {
  testMode: boolean
  timeMultiplier: number // 1초 = 10분인 경우 600
}
