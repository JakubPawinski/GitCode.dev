'use client'

import { useNotifications } from '@/contexts/notification/NotificationContext'
import { useEffect, useState, useRef, ReactNode } from 'react'
import { Notification } from '@/types/notification'
import { ToastContainer } from '../notification/ToastContainer'
import { useNotificationSSE } from '@/hooks/sse/use-notification-sse'

export const SSEProvider = ({ children }: { children: ReactNode }) => {
  const { messages } = useNotificationSSE()
  const { addNotification } = useNotifications()
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null)
  const processedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      try {
        const parsed: Notification = JSON.parse(lastMessage)

        if (!processedIds.current.has(parsed.id)) {
          processedIds.current.add(parsed.id)
          addNotification(parsed)
          setLatestNotification(parsed)
        }
      } catch (error) {
        console.error('[SSE] Failed to parse notification:', error)
      }
    }
  }, [messages, addNotification])

  return (
    <>
      {children}
      <ToastContainer newNotification={latestNotification} />
    </>
  )
}
