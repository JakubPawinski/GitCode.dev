import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { Error } from '@/components/error/Error'

test('Error renders with default message', () => {
  render(<Error error={null} />)
  expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument()
  expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
})

test('Error renders with custom message from error object', () => {
  render(<Error error={{ message: 'Custom error message' }} />)
  expect(screen.getByText('Custom error message')).toBeInTheDocument()
})

test('Error does not render "Try again" button if onClose is not provided', () => {
  render(<Error error={null} />)
  expect(screen.queryByText('Try again')).not.toBeInTheDocument()
})

test('Error renders "Try again" button and calls onClose on click', () => {
  const onClose = vi.fn()
  render(<Error error={null} onClose={onClose} />)
  const tryAgainButton = screen.getByText('Try again')
  expect(tryAgainButton).toBeInTheDocument()
  fireEvent.click(tryAgainButton)
  expect(onClose).toHaveBeenCalledTimes(1)
})
