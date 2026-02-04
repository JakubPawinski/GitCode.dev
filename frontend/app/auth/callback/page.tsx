'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/loading/Loader'
import { UserProps } from '@/components/user/User'

export interface AuthContextProps {
  accessToken: string
  user: UserProps
}

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success')

  useEffect(() => {
    if (success) {
      localStorage.setItem('is_authenticated', '1')
      router.push('/')
    }
  }, [success, router])

  return <Loader />
}