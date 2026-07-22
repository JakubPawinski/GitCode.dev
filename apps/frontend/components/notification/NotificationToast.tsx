'use client'
import { Notification } from '@/types/notification'
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { useEffect, useState } from 'react'

interface NotificationToastProps {
  notification: Notification
  onClose: () => void
  duration?: number
}

export const NotificationToast = ({
  notification,
  onClose,
  duration = 5000,
}: NotificationToastProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10)

    // Auto close
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(onClose, 300)
  }

  const getSeverityStyles = () => {
    switch (notification.severity) {
      case 'CRITICAL':
        return 'border-red-500/30 bg-red-500/10'
      case 'WARNING':
        return 'border-yellow-500/30 bg-yellow-500/10'
      default:
        return 'border-emerald-500/30 bg-emerald-500/10'
    }
  }

  const getSeverityIcon = () => {
    switch (notification.severity) {
      case 'CRITICAL':
        return <AlertTriangle className="h-5 w-5 text-red-400" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      default:
        return <CheckCircle className="h-5 w-5 text-emerald-400" />
    }
  }

  return (
    <div
      className={`pointer-events-auto w-80 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${getSeverityStyles()} ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        {getSeverityIcon()}
        <div className="flex-1">
          <h4 className="font-semibold text-white">
            {notification.payload.title}
          </h4>
          <p className="text-foreground/70 mt-1 text-sm">
            {notification.payload.message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="text-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
