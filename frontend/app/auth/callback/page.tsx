'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/loading/Loader'

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success')

  useEffect(() => {
    if (success) {
      router.push('/problems')
    }
  }, [success, router])

  return <Loader />
}
