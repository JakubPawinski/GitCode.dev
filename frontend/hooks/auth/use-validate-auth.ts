'use client'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useEffect } from 'react'
import { getLoginRedirect } from './use-get-login-redirect'
import { usePathname } from 'next/navigation'

export const useValidateAuth = () => {
  const { data: authData } = useAuth()
  const { accessToken: token } = authData || {}

  const pathname = usePathname()
  useEffect(() => {
    if (!authData) {
      localStorage.setItem('url', pathname)
    }
  }, [authData, pathname])

  return { token }
}
