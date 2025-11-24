// GitCode.dev/frontend/hooks/api/use-get-profile.ts
import { api } from '@/api/axios'
import { User } from '@/interfaces/user-interface'
import { ApiResponse } from '@/interfaces/api-response-interface'
import { useCallback, useState } from 'react'

export const useGetProfile = () => {
  const [data, setData] = useState<ApiResponse<User>>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    
    api
      .get('/api/auth/me')
      .then((res) => {
        setData(res.data)
        setError(null)
      })
      .catch((err) => {
        setError(err)
        setData(undefined)
      })
      .finally(() => setLoading(false))
  }, [])
  return { data, loading, error, refetch: getQuery }
}