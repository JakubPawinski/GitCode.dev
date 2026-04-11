import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { NotificationBell } from '@/components/notification/NotificationBell'
import { useNotifications } from '@/contexts/notification/NotificationContext'
import { useRouter } from 'next/navigation'

// Mock the context and router
vi.mock('@/contexts/notification/NotificationContext')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const mockUseNotifications = useNotifications as vi.Mock
const mockRouter = useRouter as vi.Mock

const mockNotifications = [
  {
    id: '1',
    message: 'Your submission was analyzed.',
    kind: 'SUBMISSION_ANALYZED',
    payload: { attemptId: 'attempt-123' },
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    message: 'Another notification.',
    kind: 'GENERAL',
    payload: {},
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
  expect(screen.getByText('Your submission was analyzed.')).toBeInTheDocument()
  expect(screen.getByText('Another notification.')).toBeInTheDocument()
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
  mockRouter.mockReturnValue({ push })

  render(<NotificationBell />)

  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('Your submission was analyzed.'))

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
