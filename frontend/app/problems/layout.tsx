'use client'

import { useAuth } from '@/contexts/auth/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user) {
      if (pathname === '/problems') {
        router.push('/login');
      } else {
        const redirectUrl = encodeURIComponent(pathname);
        router.push(`/login?redirect=${redirectUrl}`);
      }
    }
  }, [isLoading, isAuthenticated, router, user, pathname])

  return (
    <>{children}</>
  )
}