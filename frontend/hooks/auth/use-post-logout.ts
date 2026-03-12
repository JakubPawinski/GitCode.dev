import { api } from '@/api/axios'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

export const usePostLogout = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const { setData } = useAuth()
  const router = useRouter()

  const postMutation = useCallback(async () => {
    setLoading(true)
    setError(null)
    return api
      .post('/auth/logout', {})
      .then(() => {})
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { postMutation, loading, error }
}
