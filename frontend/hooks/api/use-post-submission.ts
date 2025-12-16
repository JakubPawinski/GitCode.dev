import { api } from '@/api/axios'
import { useCallback, useState } from 'react'
export interface PostProps<T> {
  payload: T
}
export const usePostSubmission = <T>() => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const postMutation = useCallback(({ payload }: any) => {
    setLoading(true)
    setError(null)
    api
      .post('/api/submissions', { ...payload })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { postMutation, data, loading, error }
}
