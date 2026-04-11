import { render, screen, act } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { ToastContainer } from '@/components/notification/ToastContainer'
import { Notification } from '@/types/notification'

const mockNotification: Notification = {
  id: '1',
  message: 'Test notification',
  kind: 'GENERAL',
  payload: {},
  isRead: false,
  createdAt: new Date().toISOString(),
}

test('ToastContainer renders new notifications', () => {
  const { rerender } = render(<ToastContainer newNotification={null} />)
  expect(screen.queryByText('Test notification')).not.toBeInTheDocument()

  rerender(<ToastContainer newNotification={mockNotification} />)
  expect(screen.getByText('Test notification')).toBeInTheDocument()
})

test('ToastContainer removes toast on close', () => {
  vi.useFakeTimers()
  render(<ToastContainer newNotification={mockNotification} />)
  expect(screen.getByText('Test notification')).toBeInTheDocument()

  // Fast-forward time to trigger auto-close in NotificationToast
  act(() => {
    vi.advanceTimersByTime(5000)
  })

  expect(screen.queryByText('Test notification')).not.toBeInTheDocument()
  vi.useRealTimers()
})
