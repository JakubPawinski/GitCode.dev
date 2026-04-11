import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect, vi, Mock } from 'vitest'

import { NotificationBell } from '@/components/notification/NotificationBell'
import { useNotifications } from '@/contexts/notification/NotificationContext'
import { useRouter } from 'next/navigation'

// Mock the context and router
vi.mock('@/contexts/notification/NotificationContext')
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

const mockUseNotifications = useNotifications as Mock

const mockNotifications = [
  {
    id: '1',
    kind: 'SUBMISSION_ANALYZED',
    payload: {
      attemptId: 'attempt-123',
      message: 'Your submission was analyzed.',
    },
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    kind: 'GENERAL',
    payload: {
      message: 'Another notification.',
    },
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
]

test('NotificationBell renders correctly with unread notifications', () => {
  mockUseNotifications.mockReturnValue({
    notifications: mockNotifications,
    unreadCount: 1,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  })

  render(<NotificationBell />)

  expect(screen.getByRole('button')).toBeInTheDocument()
  expect(screen.getByText('1')).toBeInTheDocument()
})

test('NotificationBell opens dropdown on click', () => {
  mockUseNotifications.mockReturnValue({
    notifications: mockNotifications,
    unreadCount: 1,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  })

  render(<NotificationBell />)

  fireEvent.click(screen.getByRole('button'))

  expect(screen.getByText('Notifications')).toBeInTheDocument()
  expect(
    screen.getByText(mockNotifications[0].payload.message)
  ).toBeInTheDocument()
  expect(
    screen.getByText(mockNotifications[1].payload.message)
  ).toBeInTheDocument()
})

test('NotificationBell calls markAsRead and navigates on notification click', () => {
  const markAsRead = vi.fn()
  const push = vi.fn()
  mockUseNotifications.mockReturnValue({
    notifications: mockNotifications,
    unreadCount: 1,
    markAsRead,
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  })
  ;(useRouter as Mock).mockReturnValue({ push })

  render(<NotificationBell />)

  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText(mockNotifications[0].payload.message))

  expect(markAsRead).toHaveBeenCalledWith('1')
  expect(push).toHaveBeenCalledWith('/problems/two-sum/submissions/attempt-123')
})

test('NotificationBell shows "No notifications yet" when there are no notifications', () => {
  mockUseNotifications.mockReturnValue({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  })

  render(<NotificationBell />)

  fireEvent.click(screen.getByRole('button'))

  expect(screen.getByText('No notifications yet')).toBeInTheDocument()
})
