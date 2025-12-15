'use client'

import { useAuth } from '@/contexts/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader } from '@/components/loading/Loader'
import LogoutButton from '@/components/logout/LogoutButton'
import TokenStore from '@/utils/token-store'

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  const descriptionroute = () => {
    router.push('/problems/two-sum/description')
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        <Loader />
      </div>
    )
  }

  return (
    <main className="bg-background h-screen w-full p-4">{user ? user.firstName : 'nie ma tokena'},{TokenStore.getToken()} 
    <button onClick={descriptionroute}>two-sum</button>
    <LogoutButton /></main>
  )
}
