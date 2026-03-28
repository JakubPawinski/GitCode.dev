'use client'
import { baseURL } from '@/api/axios'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useEffect, useState } from 'react'

export const useNotificationSSE = () => {
  const [messages, setMessages] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { data: authData } = useAuth()

  useEffect(() => {
    const token = authData?.accessToken
    if (!token) {
      return
    }

    const controller = new AbortController()

    const connectSSE = async () => {
      try {
        const response = await fetch(`${baseURL}/notifications/sse`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`)
        }

        setIsConnected(true)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          const chunk = decoder.decode(value, { stream: true })

          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data) {
                setMessages((prev) => [...prev, data])
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('[SSE] ❌ Error:', error)
        }
      } finally {
        setIsConnected(false)
      }
    }

    connectSSE()

    return () => {
      controller.abort()
    }
  }, [authData])

  return { messages, isConnected }
}
