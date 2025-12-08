'use client'
import { useEffect, useState } from 'react'
import { api } from '@/api/axios'
import { usePostRefreshToken } from '@/hooks/auth/use-post-refresh-token'
import { AuthContextProps } from '@/app/auth/callback/page'
import { Loader } from '@/components/loading/Loader'
import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'
import { useAuth } from '@/contexts/auth/AuthContext'

export const Interceptor = ({ children }: { children: React.ReactNode }) => {
  const { data: authData, setData } = useAuth()

  const { postMutation, data, loading, error } =
    usePostRefreshToken<AuthContextProps>()

  useEffect(() => {
    if (!authData) {
      postMutation()
    }
  }, [])

  useEffect(() => {
    if (data && !authData) {
      setData(data)
    }
  }, [data])

  useEffect(() => {
    if (error) {
      getLoginRedirect()
    }
  }, [error])

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
      (error) => {
        if (error?.code === 'ERR_CANCELED') {
          return Promise.reject(null)
        }
        if (error?.response?.status === 401) {
          getLoginRedirect()
        }
        return Promise.reject(error)
      }
    )
    return () => {
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [data?.accessToken])

  if (loading || !authData?.accessToken) {
    return <Loader />
  }
  return children
}
