import { api } from '@/api/axios'
import { useCallback, useState } from 'react'

export const useGetProfile = <T>() => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const getQuery = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/api/users/me')
      setData(response.data)
      setError(null)
      return response.data
    } catch (err: any) {
      setError(err)
      setData(undefined)
      if (err.response?.status === 401) {
        return { data: null }
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, refetch: getQuery }
}