import { api } from '@/api/axios'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

export const usePostLogout = () => {
  const router = useRouter()
  const postMutation = useCallback(async () => {
    return api
      .post(
        '/auth/logout',
        {},
        {
          withCredentials: true,
        }
      )
      .then(() => router.push('/login'))
  }, [])

  return { postMutation }
}
