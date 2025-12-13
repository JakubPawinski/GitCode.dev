import { api } from '@/api/axios'
import { useCallback, useState } from 'react'

export const usePostRefreshToken = <T>() => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const postMutation = useCallback(async () => {
    setLoading(true)
    setError(null)
    return api
      .post('/auth/refresh', null, { withCredentials: true })
      .then((res) => {
        setData(res.data.data)
        return res.data.data
      })
      .catch((err) => {
        setError(err)
        return Promise.reject(err)
      })
      .finally(() => setLoading(false))
  }, [])

  return { postMutation, data, loading, error }
}
