import { NextRequest, NextResponse } from 'next/server'
import { seasonStore } from '@/lib/season-store'
import type { TagType } from '@/lib/types'

interface AddTagBody {
  seasonId: string
  date: string
  tag: TagType
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AddTagBody
    const { seasonId, date, tag } = body

    if (!seasonId || !date || !tag) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const season = await seasonStore.incrementTagCount(seasonId, date, tag)

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    const dailyRecord = season.dailyRecords.find((r) => r.date === date)

    return NextResponse.json({
      success: true,
      data: {
        season,
        dailyRecord,
      },
    })
  } catch (error) {
    console.error('Error adding tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
