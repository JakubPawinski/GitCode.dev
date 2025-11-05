import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'
interface GetTaskProps {
  title: string
}
export const useGetTask = ({ title }: GetTaskProps) => {
  const [data, setData] = useState()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/tasks/${title}`, { signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) getQuery()

    return () => controller.abort()
  }, [title])

  return { data, loading, error }
}
