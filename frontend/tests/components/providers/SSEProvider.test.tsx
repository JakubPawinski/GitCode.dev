import { render, screen } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { SSEProvider } from '@/components/providers/SSEProvider'
import { useNotifications } from '@/contexts/notification/NotificationContext'
import { useNotificationSSE } from '@/hooks/sse/use-notification-sse'
import { Notification } from '@/types/notification'

// Mock hooks and components
vi.mock('@/contexts/notification/NotificationContext')
vi.mock('@/hooks/sse/use-notification-sse')
vi.mock('../notification/ToastContainer', () => ({
  ToastContainer: ({
    newNotification,
  }: {
    newNotification: Notification | null
  }) => (
    <div data-testid="toast-container">
      {newNotification && <div>{newNotification.payload.message}</div>}
    </div>
  ),
}))

const mockUseNotifications = useNotifications as vi.Mock
const mockUseNotificationSSE = useNotificationSSE as vi.Mock

const mockNotification: Notification = {
  id: '1',
  severity: 'INFO',
  kind: 'TEST',
  type: 'TEST',
  payload: {
    title: 'Test Title',
    message: 'Test message',
  },
  isRead: false,
  createdAt: new Date().toISOString(),
}

test('SSEProvider processes new messages and adds notifications', () => {
  const addNotification = vi.fn()
  mockUseNotifications.mockReturnValue({ addNotification })
  const { rerender } = render(
    <SSEProvider>
      <div>Child content</div>
    </SSEProvider>
  )

  mockUseNotificationSSE.mockReturnValue({ messages: [] })
  rerender(
    <SSEProvider>
      <div>Child content</div>
    </SSEProvider>
  )

  expect(addNotification).not.toHaveBeenCalled()
  expect(screen.queryByText('Test message')).not.toBeInTheDocument()

  mockUseNotificationSSE.mockReturnValue({
    messages: [JSON.stringify(mockNotification)],
  })
  rerender(
    <SSEProvider>
      <div>Child content</div>
    </SSEProvider>
  )

  expect(addNotification).toHaveBeenCalledWith(mockNotification)
  expect(screen.getByText('Test message')).toBeInTheDocument()
})

test('SSEProvider does not process the same message twice', () => {
  const addNotification = vi.fn()
  mockUseNotifications.mockReturnValue({ addNotification })
  mockUseNotificationSSE.mockReturnValue({
    messages: [JSON.stringify(mockNotification)],
  })

  const { rerender } = render(
    <SSEProvider>
      <div>Child content</div>
    </SSEProvider>
  )

  expect(addNotification).toHaveBeenCalledTimes(1)

  rerender(
    <SSEProvider>
      <div>Child content</div>
    </SSEProvider>
  )

  expect(addNotification).toHaveBeenCalledTimes(1)
})
