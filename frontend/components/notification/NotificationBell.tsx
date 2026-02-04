'use client'
import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2, Sparkles } from 'lucide-react'
import { useNotifications } from '@/contexts/notification/NotificationContext'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from '@/utils/date'

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications()

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)

    // Navigate based on notification kind
    if (
      notification.kind === 'SUBMISSION_ANALYZED' &&
      notification.payload.attemptId
    ) {
      // TODO: Get problem slug from context or notification
      router.push(
        `/problems/two-sum/submissions/${notification.payload.attemptId}`
      )
    }
    setIsOpen(false)
  }

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case 'SUBMISSION_ANALYZED':
        return <Sparkles className="h-4 w-4 text-purple-400" />
      default:
        return <Bell className="h-4 w-4 text-blue-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-primary/10 relative rounded-lg p-2 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="border-primary/20 bg-background absolute top-full right-0 mt-2 w-80 rounded-lg border shadow-xl">
          {/* Header */}
          <div className="border-primary/20 flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-foreground/60 hover:text-foreground text-xs transition-colors"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-foreground/60 text-xs transition-colors hover:text-red-400"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-foreground/50 p-6 text-center text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`hover:bg-primary/5 border-primary/10 w-full border-b p-3 text-left transition-colors last:border-0 ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.kind)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {notification.payload.title}
                        </span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-foreground/60 mt-0.5 text-sm">
                        {notification.payload.message}
                      </p>
                      <span className="text-foreground/40 mt-1 text-xs">
                        {formatDistanceToNow(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
