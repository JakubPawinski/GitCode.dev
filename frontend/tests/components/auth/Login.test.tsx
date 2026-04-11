import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { Login } from '@/components/auth/Login'
import { getLoginRedirect } from '@/hooks/auth/use-get-login-redirect'

// Mock the hook
vi.mock('@/hooks/auth/use-get-login-redirect')

const mockGetLoginRedirect = getLoginRedirect as vi.Mock

test('Login renders correctly', () => {
  render(<Login />)

  expect(screen.getByText('Welcome to GitCode.dev')).toBeInTheDocument()
  expect(
    screen.getByText('Sign in to continue and start your coding journey.')
  ).toBeInTheDocument()
  expect(screen.getByTestId('login-button')).toBeInTheDocument()
})

test('Login calls getLoginRedirect on button click', () => {
  render(<Login />)

  const loginButton = screen.getByTestId('login-button')
  fireEvent.click(loginButton)

  expect(mockGetLoginRedirect).toHaveBeenCalledTimes(1)
})
