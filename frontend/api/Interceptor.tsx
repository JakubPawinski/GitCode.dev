/*'use client'
import { useEffect } from 'react'
import { api } from '@/api/axios'
import { usePostRefreshToken } from '@/hooks/auth/use-post-refresh-token'
import { AuthContextProps } from '@/app/auth/callback/page'
import { Loader } from '@/components/loading/Loader'
import { useAuth } from '@/contexts/auth/AuthContext'
import { usePathname, useRouter } from 'next/navigation'

export const Interceptor = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()

  const { data: authData, setData } = useAuth()

  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  const { postMutation, data, error } = usePostRefreshToken<AuthContextProps>()

  useEffect(() => {
    if (!authData) {
      postMutation()
    }
  }, [])

  useEffect(() => {
    if (data && !authData) {
      setData(data)
    }
  }, [data, authData])

  useEffect(() => {
    if (error) {
      router.push('/login')
    }
  }, [router, error])

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

  if (!isLoginPage && !authData?.accessToken) {
    return <Loader />
  }
  return children
}
*/