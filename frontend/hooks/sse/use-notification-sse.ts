'use client'
import { baseURL } from '@/api/axios'
import { useEffect, useState } from 'react'

export const useNotificationSSE = () => {
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const eventSource = new EventSource(`${baseURL}/notifications/sse`, {
      withCredentials: true,
    })
    eventSource.onmessage = (event: MessageEvent) => {
      setMessages((previous: string[]) => [...previous, event.data])
    }
    eventSource.onerror = () => {
      eventSource.close()
    }
    return () => {
      eventSource.close()
    }
  }, [])
  return { messages }
}
