import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'
export const useGetRefreshToken = <T>({ cookie }: { cookie: string }) => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/api/auth/refresh`, { signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) getQuery()

    return () => controller.abort()
  }, [cookie])

  return { data, loading, error }
}
