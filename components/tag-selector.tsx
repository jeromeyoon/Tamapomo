'use client'

import { useState } from 'react'
import type { TagType, DailyRecord } from '@/lib/types'

interface TagSelectorProps {
  date: string
  currentRecord?: DailyRecord
  onTagSelect: (tag: TagType) => Promise<void>
}

const TAGS: Array<{
  type: TagType
  label: string
  icon: string
  color: string
  description: string
}> = [
  {
    type: 'focus',
    label: '집중',
    icon: '📚',
    color: 'bg-blue-500',
    description: '공부, 코딩, 업무',
  },
  {
    type: 'exercise',
    label: '운동',
    icon: '💪',
    color: 'bg-red-500',
    description: '운동, 산책, 스트레칭',
  },
  {
    type: 'rest',
    label: '휴식',
    icon: '🌿',
    color: 'bg-green-500',
    description: '휴식, 음악, 일기',
  },
  {
    type: 'sleep',
    label: '잠',
    icon: '😴',
    color: 'bg-purple-500',
    description: '수면, 낮잠',
  },
]

export function TagSelector({ date, currentRecord, onTagSelect }: TagSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null)

  const handleTagClick = async (tag: TagType) => {
    setLoading(true)
    setSelectedTag(tag)
    try {
      await onTagSelect(tag)
    } catch (error) {
      console.error('Failed to select tag:', error)
    } finally {
      setLoading(false)
      setSelectedTag(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">오늘의 활동을 기록해보세요</h2>
        <p className="text-gray-600">{date}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
        {TAGS.map((tag) => (
          <button
            key={tag.type}
            onClick={() => handleTagClick(tag.type)}
            disabled={loading}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedTag === tag.type
                ? `${tag.color} text-white border-gray-300`
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-3xl mb-2">{tag.icon}</div>
            <div className="font-semibold text-sm">{tag.label}</div>
            <div className="text-xs text-gray-600 mt-1">{tag.description}</div>
          </button>
        ))}
      </div>

      {currentRecord && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">오늘의 기록</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{currentRecord.focusCount}</div>
              <div className="text-sm text-gray-600">집중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{currentRecord.exerciseCount}</div>
              <div className="text-sm text-gray-600">운동</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{currentRecord.restCount}</div>
              <div className="text-sm text-gray-600">휴식</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{currentRecord.sleepCount}</div>
              <div className="text-sm text-gray-600">잠</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
