import { NextRequest, NextResponse } from 'next/server'
import { seasonStore } from '@/lib/season-store'
import type { TagType } from '@/lib/types'

interface CreateSeasonBody {
  userId: string
}

interface AddRecordBody {
  seasonId: string
  date: string
  tag: TagType
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSeasonBody
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // 활성 시즌 확인
    let season = await seasonStore.getActiveSeason(userId)

    if (!season) {
      // 새로운 시즌 생성
      const seasons = await seasonStore.getUserSeasons(userId)
      const seasonNumber = seasons.length + 1
      season = await seasonStore.createSeason(userId, seasonNumber)
    }

    return NextResponse.json({
      success: true,
      data: season,
    })
  } catch (error) {
    console.error('Error creating/fetching season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const seasons = await seasonStore.getUserSeasons(userId)

    return NextResponse.json({
      success: true,
      data: seasons,
    })
  } catch (error) {
    console.error('Error fetching seasons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
