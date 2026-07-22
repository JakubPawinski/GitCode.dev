'use client'
import { useState, useEffect } from 'react'
import { Notification } from '@/types/notification'
import { NotificationToast } from './NotificationToast'

interface ToastContainerProps {
  newNotification: Notification | null
}

export const ToastContainer = ({ newNotification }: ToastContainerProps) => {
  const [toasts, setToasts] = useState<Notification[]>([])

  useEffect(() => {
    if (newNotification) {
      setToasts((prev) => [...prev, newNotification])
    }
  }, [newNotification])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="pointer-events-none fixed top-20 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
