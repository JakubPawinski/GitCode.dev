import { api } from '@/api/axios'
import { decodedData } from '@/utils/decode'
import { useCallback, useState } from 'react'
export interface PostProps<T> {
  payload: T
}

export const usePostAiTutor = () => {
  const [data, setData] = useState<any>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const postMutation = useCallback(({ payload }: any) => {
    setLoading(true)
    setError(null)
    api
      .post(
        '/ai/tutor/stream',
        { ...payload },
        {
          responseType: 'stream',
          adapter: 'fetch',
        }
      )
      .then(async (res) => setData(await decodedData({ data: res.data })))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { postMutation, data, loading, error }
}
