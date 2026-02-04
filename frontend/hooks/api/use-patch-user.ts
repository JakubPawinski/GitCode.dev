import { api } from '@/api/axios'
import { UserProps } from '@/components/user/User'
import { useCallback, useEffect, useState } from 'react'
export const usePatchUser = <T>({
  payload,
}: {
  payload: Partial<UserProps>
}) => {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const patchMutation = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .patch(
        `/users/me`,
        { ...payload },
        {
          signal: controller.signal,
        }
      )
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) patchMutation()

    return () => controller.abort()
  }, [])

  return { data, loading, error }
}
