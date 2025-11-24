// GitCode.dev/frontend/hooks/api/use-logout.ts
import { api } from '@/api/axios'
import { useCallback, useState } from 'react'

export const useLogout = () => {
  const [loading, setLoading] = useState<boolean>(false)

  const logoutMutation = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.post('/api/auth/logout')
      return response.data
    } finally {
      setLoading(false)
    }
  }, [])

  return { logoutMutation, loading }
}