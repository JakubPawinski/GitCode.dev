import { render, screen, fireEvent, act } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { NotificationToast } from '@/components/notification/NotificationToast'
import { Notification } from '@/types/notification'

vi.useFakeTimers()

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

test('NotificationToast renders correctly', () => {
  render(
    <NotificationToast notification={mockNotification} onClose={vi.fn()} />
  )

  // Animate in
  act(() => {
    vi.advanceTimersByTime(10)
  })

  expect(screen.getByText('Test Title')).toBeInTheDocument()
  expect(screen.getByText('Test message')).toBeInTheDocument()
})

test('NotificationToast calls onClose after duration', () => {
  const onClose = vi.fn()
  render(
    <NotificationToast
      notification={mockNotification}
      onClose={onClose}
      duration={5000}
    />
  )

  act(() => {
    vi.advanceTimersByTime(5010) // duration + animate in
  })

  expect(onClose).not.toHaveBeenCalled()

  act(() => {
    vi.advanceTimersByTime(300) // animate out
  })

  expect(onClose).toHaveBeenCalled()
})

test('NotificationToast calls onClose when close button is clicked', () => {
  const onClose = vi.fn()
  render(
    <NotificationToast notification={mockNotification} onClose={onClose} />
  )

  act(() => {
    vi.advanceTimersByTime(10)
  })

  fireEvent.click(screen.getByRole('button'))

  expect(onClose).not.toHaveBeenCalled()

  act(() => {
    vi.advanceTimersByTime(300)
  })

  expect(onClose).toHaveBeenCalled()
})

test('NotificationToast displays correct icon and color for severity', () => {
  const { rerender } = render(
    <NotificationToast
      notification={{ ...mockNotification, severity: 'CRITICAL' }}
      onClose={vi.fn()}
    />
  )
  expect(screen.getByTestId('root-div')).toHaveClass('border-red-500/30')

  rerender(
    <NotificationToast
      notification={{ ...mockNotification, severity: 'WARNING' }}
      onClose={vi.fn()}
    />
  )
  expect(screen.getByTestId('root-div')).toHaveClass('border-yellow-500/30')

  rerender(
    <NotificationToast
      notification={{ ...mockNotification, severity: 'INFO' }}
      onClose={vi.fn()}
    />
  )
  expect(screen.getByTestId('root-div')).toHaveClass('border-emerald-500/30')
})
