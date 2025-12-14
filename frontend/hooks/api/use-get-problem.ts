import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'
export const useGetProblem = <T>({ problem }: { problem: string }) => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/problems/${problem}`, { signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) getQuery()

    return () => controller.abort()
  }, [problem])

  return { data, loading, error }
}
