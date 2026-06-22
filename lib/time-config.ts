import type { TimeConfig } from './types'

// 테스트 모드: 1초 = 10분 (600배속)
const testConfig: TimeConfig = {
  testMode: true,
  timeMultiplier: 600, // 1초가 600초(10분)
}

// 프로덕션 모드: 실제 시간
const prodConfig: TimeConfig = {
  testMode: false,
  timeMultiplier: 1,
}

// 환경변수로 선택
const config: TimeConfig =
  process.env.POMOCHI_TEST_MODE === 'true' ? testConfig : prodConfig

export function getTimeConfig(): TimeConfig {
  return config
}

export function getRealSeconds(testSeconds: number): number {
  return testSeconds * config.timeMultiplier
}

export function getTestSeconds(realSeconds: number): number {
  return realSeconds / config.timeMultiplier
}

// 테스트용 헬퍼
export function isTestMode(): boolean {
  return config.testMode
}

export function getTimeMultiplier(): number {
  return config.timeMultiplier
}
