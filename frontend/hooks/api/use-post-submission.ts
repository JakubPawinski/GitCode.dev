'use client'
import { api } from '@/api/axios'
import { useCallback, useState } from 'react'
export interface PostProps<T> {
  payload: T
  headers?: {
    [key: string]: string
  }
}
export type PostMutationType<T> = ({ payload, headers }: PostProps<T>) => void

export const usePostSubmission = <T>() => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const postMutation = useCallback(({ payload, headers }: PostProps<T>) => {
    setLoading(true)
    setError(null)
    api
      .post('/submission', { ...payload }, { headers: headers })
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { postMutation, data, loading, error }
}
