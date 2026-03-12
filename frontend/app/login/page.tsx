'use client'

import { Login } from '@/components/auth/Login'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { data } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (data?.accessToken) {
      router.replace('/')
    }
  }, [router, data?.accessToken])

  return <Login />
}
