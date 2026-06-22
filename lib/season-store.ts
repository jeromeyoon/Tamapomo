import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { SeasonData, DailyRecord } from './types'

const DEFAULT_DB_PATH = join(process.cwd(), '.data', 'pomochi-season.json')

interface SeasonDatabase {
  seasons: SeasonData[]
}

class SeasonStore {
  private dbPath: string

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    this.dbPath = dbPath
  }

  private async ensureDir(): Promise<void> {
    try {
      await mkdir(dirname(this.dbPath), { recursive: true })
    } catch {
      // 디렉토리 생성 실패 무시
    }
  }

  private async readDb(): Promise<SeasonDatabase> {
    try {
      const data = await readFile(this.dbPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return { seasons: [] }
    }
  }

  private async writeDb(db: SeasonDatabase): Promise<void> {
    await this.ensureDir()
    await writeFile(this.dbPath, JSON.stringify(db, null, 2), 'utf-8')
  }

  async createSeason(userId: string, seasonNumber: number): Promise<SeasonData> {
    const db = await this.readDb()

    const season: SeasonData = {
      id: crypto.randomUUID(),
      userId,
      seasonNumber,
      startDate: new Date().toISOString().split('T')[0],
      dailyRecords: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    db.seasons.push(season)
    await this.writeDb(db)

    return season
  }

  async getActiveSeason(userId: string): Promise<SeasonData | null> {
    const db = await this.readDb()
    const season = db.seasons
      .filter((s) => s.userId === userId && !s.endDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    return season || null
  }

  async addDailyRecord(seasonId: string, record: DailyRecord): Promise<SeasonData | null> {
    const db = await this.readDb()
    const season = db.seasons.find((s) => s.id === seasonId)

    if (!season) return null

    // 같은 날짜 기록이 있으면 업데이트
    const existingIndex = season.dailyRecords.findIndex((r) => r.date === record.date)

    if (existingIndex >= 0) {
      season.dailyRecords[existingIndex] = record
    } else {
      season.dailyRecords.push(record)
    }

    // 14일이 되었는지 확인
    if (season.dailyRecords.length >= 14) {
      season.endDate = new Date().toISOString().split('T')[0]
    }

    season.updatedAt = new Date().toISOString()
    await this.writeDb(db)

    return season
  }

  async updateDailyRecord(seasonId: string, date: string, updates: Partial<DailyRecord>): Promise<SeasonData | null> {
    const db = await this.readDb()
    const season = db.seasons.find((s) => s.id === seasonId)

    if (!season) return null

    const recordIndex = season.dailyRecords.findIndex((r) => r.date === date)

    if (recordIndex >= 0) {
      season.dailyRecords[recordIndex] = {
        ...season.dailyRecords[recordIndex],
        ...updates,
      }
    } else {
      season.dailyRecords.push({
        date,
        focusCount: 0,
        exerciseCount: 0,
        restCount: 0,
        sleepCount: 0,
        pauseCount: 0,
        isConsecutive: false,
        ...updates,
      })
    }

    season.updatedAt = new Date().toISOString()
    await this.writeDb(db)

    return season
  }

  async getSeason(seasonId: string): Promise<SeasonData | null> {
    const db = await this.readDb()
    return db.seasons.find((s) => s.id === seasonId) || null
  }

  async getUserSeasons(userId: string): Promise<SeasonData[]> {
    const db = await this.readDb()
    return db.seasons
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async incrementTagCount(
    seasonId: string,
    date: string,
    tag: 'focus' | 'exercise' | 'rest' | 'sleep'
  ): Promise<SeasonData | null> {
    const db = await this.readDb()
    const season = db.seasons.find((s) => s.id === seasonId)

    if (!season) return null

    let record = season.dailyRecords.find((r) => r.date === date)

    if (!record) {
      record = {
        date,
        focusCount: 0,
        exerciseCount: 0,
        restCount: 0,
        sleepCount: 0,
        pauseCount: 0,
        isConsecutive: false,
      }
      season.dailyRecords.push(record)
    }

    // 태그 카운트 증가
    const tagKey = `${tag}Count` as keyof DailyRecord
    const value = record[tagKey]
    if (typeof value === 'number') {
      ;(record[tagKey] as number) = value + 1
    }

    season.updatedAt = new Date().toISOString()
    await this.writeDb(db)

    return season
  }

  async getDailyRecord(seasonId: string, date: string): Promise<DailyRecord | null> {
    const season = await this.getSeason(seasonId)
    if (!season) return null

    return season.dailyRecords.find((r) => r.date === date) || null
  }
}

export const seasonStore = new SeasonStore()
