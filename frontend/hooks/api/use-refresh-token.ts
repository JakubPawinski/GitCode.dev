// GitCode.dev/frontend/hooks/api/use-refresh-token.ts
import { api } from '@/api/axios'
import { useCallback, useState } from 'react'

export const useRefreshToken = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const refreshMutation = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.post('/api/auth/refresh')
      return response.data
    } catch (err: any) {
      setError(err)
      if (err.response?.status === 401) {
        return { data: { accessToken: null } }
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { refreshMutation, loading, error }
}