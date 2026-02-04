import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'
export const useGetMyProfile = <T>() => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/auth/me`, {
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
