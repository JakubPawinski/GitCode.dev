import { render, screen, act } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { ToastContainer } from '@/components/notification/ToastContainer'
import { Notification, NotificationPayload } from '@/types/notification'

const mockNotification: Notification = {
  id: '1',
  kind: 'GENERAL',
  severity: 'CRITICAL',
  type: 'test',
  payload: {
    title: 'test',
    message: 'Test notification',
    attemptId: '123',
    test: 'd',
  },
  isRead: false,
  createdAt: new Date().toISOString(),
}

test('ToastContainer renders new notifications', () => {
  const { rerender } = render(<ToastContainer newNotification={null} />)
  expect(screen.queryByText('Test notification')).not.toBeInTheDocument()

  rerender(<ToastContainer newNotification={mockNotification} />)
  expect(screen.getByText('Test notification')).toBeInTheDocument()
})
