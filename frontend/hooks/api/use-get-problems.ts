import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'

interface QueryProps {
  difficulty?: string
  topic?: string
  sortBy?: string
  query?: string
  sortOrder?: string
  page?: number
  limit?: number
}

export const useGetProblems = <T>({ params }: { params: QueryProps }) => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const controller = new AbortController()
  const stringifiedParams = JSON.stringify(params) || ''

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/problems', {
        params: params,
        signal: controller.signal,
      })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [stringifiedParams])

  useEffect(() => {
    getQuery()

    return () => controller.abort()
  }, [getQuery])

  return { data, loading, error }
}
