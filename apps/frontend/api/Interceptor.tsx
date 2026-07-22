'use client'
import { useEffect } from 'react'
import { api } from '@/api/axios'
import { usePostRefreshToken } from '@/hooks/auth/use-post-refresh-token'
import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'
import { AuthContextProps } from '@/app/auth/callback/page'
import { Loader } from '@/components/loading/Loader'
import { useAuth } from '@/contexts/auth/AuthContext'
import { usePathname } from 'next/navigation'

// Pages a guest can view without a session. The silent token refresh still
// runs on them, so a returning user gets logged in automatically — but a
// failed refresh must not bounce a guest into the Keycloak redirect.
const PUBLIC_ROUTES = ['/', '/trending']

export const Interceptor = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()

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
  const { data: authData, setData, isLoggingOut, setIsLoggingOut } = useAuth()

  const { postMutation, data, error } = usePostRefreshToken<AuthContextProps>()

  useEffect(() => {
    if (isLoggingOut) {
      // Consume the one-shot flag: skip exactly the refresh attempt that
      // logout's own `setData(null)` would otherwise trigger, then fall
      // back to normal behavior for anything after.
      setIsLoggingOut(false)
      return
    }
    if (authData?.accessToken) return
    if (!authData) {
      // Sync directly off *this* call's own result — never off `data`, the
      // hook's last-successful-refresh cache. That cache doesn't get cleared
      // by logout, so watching it in a separate effect (the previous
      // approach) would re-adopt the stale pre-logout session into
      // AuthContext the moment `authData` went back to null.
      postMutation()
        .then((tokenData) => setData(tokenData))
        .catch(() => {})
    }
  }, [authData, isLoggingOut])

  useEffect(() => {
    if (error && !isPublic) {
      getLoginRedirect()
    }
  }, [error, isPublic])

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
