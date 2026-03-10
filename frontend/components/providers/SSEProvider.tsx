// 'use client'
// import { useNotificationSSE } from '@/hooks/sse/use-notification-sse'
// import { useNotifications } from '@/contexts/notification/NotificationContext'
// import { useEffect, useState, useRef } from 'react'
// import { Notification } from '@/types/notification'
// import { ToastContainer } from '../notification/ToastContainer'

// export const SSEProvider = ({ children }: { children: React.ReactNode }) => {
//   const { messages } = useNotificationSSE()
//   const { addNotification } = useNotifications()
//   const [latestNotification, setLatestNotification] =
//     useState<Notification | null>(null)
//   const processedIds = useRef<Set<string>>(new Set())

//   useEffect(() => {
//     if (messages.length > 0) {
//       const lastMessage = messages[messages.length - 1]
//       try {
//         const parsed: Notification = JSON.parse(lastMessage)

//         // Avoid duplicates
//         if (!processedIds.current.has(parsed.id)) {
//           processedIds.current.add(parsed.id)
//           addNotification(parsed)
//           setLatestNotification(parsed)
//         }
//       } catch (error) {
//         console.error('[SSE] Failed to parse notification:', error)
//       }
//     }
//   }, [messages, addNotification])

//   return (
//     <>
//       {children}
//       <ToastContainer newNotification={latestNotification} />
//     </>
//   )
// }
