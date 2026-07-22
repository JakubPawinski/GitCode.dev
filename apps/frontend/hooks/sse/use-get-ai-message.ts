'use client'
import { baseURL } from '@/api/axios'
import { useEffect, useState } from 'react'
interface StreamMessage {
  text?: string
  done?: boolean
}
export const useAiMessageSSE = () => {
  const [message, setMessage] = useState<string>('')
  useEffect(() => {
    const eventSource = new EventSource(`${baseURL}/ai/tutor/stream`, {
      withCredentials: true,
    })

    eventSource.onmessage = (event: MessageEvent) => {
      const data: StreamMessage = JSON.parse(event.data)

      if (data.text) {
        setMessage((prev) => prev + data.text)
      }

      if (data.done) {
        eventSource.close()
      }
    }
    eventSource.onerror = () => {
      eventSource.close()
    }
    return () => {
      eventSource.close()
    }
  }, [])
  return { message }
}
