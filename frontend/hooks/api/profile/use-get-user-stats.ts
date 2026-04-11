import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'

export interface UserStatsProps {
  activityHeatmap: {
    date: string
    submissions: number
    solved: number
  }[]

  consistencyScore: number
  difficultyBreakdown: {
    easy: number
    medium: number
    hard: number
    total: number
  }

  languageStats: any[]
  performanceMetrics: {
    avgExecutionTime: number | null
    avgMemoryUsed: number | null
    bestExecutionTime: number | null
    bestMemoryUsed: number | null
    executionTimePercentile: number | null
    [key: string]: any
  }
  problemsAttempted: number
  problemsSolved: number

  streak: {
    currentStreak: number
    longestStreak: number
    lastActivityDate: string | null
    activeToday: boolean
  }

  successRate: number
  topicStats: any[]
  totalSubmissions: number
  weeklyActivity: any[]
}
export const useGetUserStats = <T>() => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/submissions/stats/extended/`, {
        signal: controller.signal,
      })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) getQuery()

    return () => controller.abort()
  }, [])

  return { data, loading, error }
}
