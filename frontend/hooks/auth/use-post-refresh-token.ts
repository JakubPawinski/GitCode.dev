import { api } from '@/api/axios'
import { useCallback, useState } from 'react'

export const usePostRefreshToken = <T>() => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const postMutation = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .post('/auth/refresh', null, { withCredentials: true })
      .then((res) => {
        setData(res.data.data)
      })

      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { postMutation, data, loading, error }
}
