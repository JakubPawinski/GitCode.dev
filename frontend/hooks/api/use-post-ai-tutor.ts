import { api } from '@/api/axios'
import { useCallback, useState } from 'react'
export interface PostProps<T> {
  payload: T
}

type TutorStreamEvent = {
  text?: string
  done?: boolean
}

const tryParseTutorEvent = (raw: string): TutorStreamEvent | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed === '[DONE]') return { done: true }
  try {
    return JSON.parse(trimmed) as TutorStreamEvent
  } catch {
    return null
  }
}

export const usePostAiTutor = () => {
  const [data, setData] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()

  const postMutation = useCallback(({ payload }: any) => {
    setLoading(true)
    setError(null)
    setData('')
    api
      .post(
        '/ai/tutor/stream',
        { ...payload },
        {
          responseType: 'stream',
          adapter: 'fetch',
        }
      )
      .then(async (res) => {
        const reader = res.data.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split(/\r?\n/)
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            const payload = trimmedLine.startsWith('data:')
              ? trimmedLine.slice(5).trimStart()
              : trimmedLine

            const event = tryParseTutorEvent(payload)
            if (!event) continue

            if (event.done) {
              buffer = ''
              break
            }

            if (typeof event.text === 'string' && event.text.length > 0) {
              setData((prev) => prev + event.text)
            }
          }

          if (!buffer && lines.some((l) => l.includes('"done": true'))) {
            break
          }
        }

        const finalPayload = buffer.trim().startsWith('data:')
          ? buffer.trim().slice(5).trimStart()
          : buffer
        const finalEvent = tryParseTutorEvent(finalPayload)
        if (
          finalEvent &&
          typeof finalEvent.text === 'string' &&
          finalEvent.text.length > 0
        ) {
          setData((prev) => prev + finalEvent.text)
        }
      })
      .catch((err) => setError(err))
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { postMutation, data, loading, error }
}
