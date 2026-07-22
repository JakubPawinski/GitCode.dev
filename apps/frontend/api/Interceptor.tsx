'use client'
import { useEffect } from 'react'
import { api } from '@/api/axios'
import { usePostRefreshToken } from '@/hooks/auth/use-post-refresh-token'
import { AuthContextProps } from '@/app/auth/callback/page'
import { Loader } from '@/components/loading/Loader'
import { useAuth } from '@/contexts/auth/AuthContext'
import { usePathname, useRouter } from 'next/navigation'

// Pages a guest can view without a session. The silent token refresh still
// runs on them, so a returning user gets logged in automatically — but a
// failed refresh must not bounce a guest to /login.
const PUBLIC_ROUTES = ['/', '/trending']

export const Interceptor = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) return children

  return (
    <InterceptorInner isPublic={PUBLIC_ROUTES.includes(pathname)}>
      {children}
    </InterceptorInner>
  )
}

const InterceptorInner = ({
  children,
  isPublic,
}: {
  children: React.ReactNode
  isPublic: boolean
}) => {
  const router = useRouter()

  const { data: authData, setData } = useAuth()

  const { postMutation, data, error } = usePostRefreshToken<AuthContextProps>()

  useEffect(() => {
    if (authData?.accessToken) return
    if (!authData) postMutation()
  }, [authData])

  useEffect(() => {
    if (data && !authData) {
      setData(data)
    }
  }, [data, authData])

  useEffect(() => {
    if (error && !isPublic) {
      router.push('/login')
    }
  }, [router, error, isPublic])

  useEffect(() => {
    const token = data?.accessToken
    if (!token) return

    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${token}`
        return config
      },
      (error) => Promise.reject(error)
    )
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error?.code === 'ERR_CANCELED') {
          return Promise.reject(null)
        }
        if (error?.response?.status === 401) {
          return postMutation().then((tokenData) => {
            setData(tokenData)
            api.defaults.headers.common.Authorization = `Bearer ${tokenData.accessToken}`
            error.config.headers.Authorization = `Bearer ${tokenData.accessToken}`
            return api(error.config)
          })
        }
        return Promise.reject(error)
      }
    )
    return () => {
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [data?.accessToken])

  if (!authData?.accessToken) {
    // Guests may view public pages while the silent refresh resolves (or fails)
    // in the background; protected pages keep the loader until a token exists.
    if (isPublic) return children
    return <Loader />
  }
  return children
}
