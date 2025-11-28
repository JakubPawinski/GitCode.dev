import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'

interface QueryProps {
  difficulty?: string
  topic?: string
  query?: string
  page?: number
  limit?: number
}

export const useGetProblems = <T>({
  difficulty,
  topic,
  query,
  page = 1,
  limit = 100,
}: QueryProps) => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    const params: Record<string, string | number> = {
      page,
      limit,
    }
    if (difficulty) params.difficulty = difficulty
    if (topic) params.topic = topic
    if (query) params.query = query

    setLoading(true)
    setError(null)
    api
      .get('/problems', {
        params: params,
        signal: controller.signal,
      })
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [difficulty, topic, page, limit])

  useEffect(() => {
    if (!data) getQuery()

    return () => controller.abort()
  }, [])

  return { data, loading, error }
}
