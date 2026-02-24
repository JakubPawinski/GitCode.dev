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
      console.log('[SSE] No token, skipping connection')
      return
    }

    console.log('[SSE] Connecting to:', `${baseURL}/notifications/sse`)
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

        console.log('[SSE] Response status:', response.status)

        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`)
        }

        setIsConnected(true)
        console.log('[SSE] Connected successfully!')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[SSE] Stream ended')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          console.log('[SSE] Raw chunk:', chunk)

          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data) {
                console.log('[SSE] 📬 Notification received:', data)
                try {
                  const parsed = JSON.parse(data)
                  console.log('[SSE] 📬 Parsed notification:', parsed)
                } catch {
                  console.log('[SSE] 📬 Raw data (not JSON):', data)
                }
                setMessages((prev) => [...prev, data])
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('[SSE] ❌ Error:', error)
        } else {
          console.log('[SSE] Connection aborted')
        }
      } finally {
        setIsConnected(false)
        console.log('[SSE] Disconnected')
      }
    }

    connectSSE()

    return () => {
      console.log('[SSE] Cleanup - aborting connection')
      controller.abort()
    }
  }, [authData?.accessToken])

  return { messages, isConnected }
}
