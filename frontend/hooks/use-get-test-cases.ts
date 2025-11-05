import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'

export const useGetTestCases = (submissionId: { submissionId: string }) => {
  const [data, setData] = useState()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/submission/${submissionId}`, { signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) getQuery()

    return () => controller.abort()
  }, [])

  return { data, loading, error }
}
