export interface NotificationPayload {
  title: string
  message: string
  attemptId?: string
  [key: string]: any
}

export interface Notification {
  id: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  kind: string
  type: string
  payload: NotificationPayload
  isRead: boolean
  createdAt: string
}
