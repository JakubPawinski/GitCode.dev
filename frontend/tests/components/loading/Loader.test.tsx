import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import { Loader } from '@/components/loading/Loader'

test('Loader renders correctly with default props', () => {
  render(<Loader />)
  const spinner = screen.getByRole('status', { hidden: true })
  expect(spinner).toBeInTheDocument()
  expect(spinner).toHaveStyle('width: 48px')
  expect(spinner).toHaveStyle('height: 48px')
  expect(spinner.parentElement).toHaveClass(
    'absolute flex h-full w-full items-center justify-center'
  )
})

test('Loader renders correctly with custom size', () => {
  render(<Loader size={64} />)
  const spinner = screen.getByRole('status', { hidden: true })
  expect(spinner).toHaveStyle('width: 64px')
  expect(spinner).toHaveStyle('height: 64px')
})

test('Loader renders correctly when not centered', () => {
  render(<Loader center={false} />)
  const spinner = screen.getByRole('status', { hidden: true })
  expect(spinner).toBeInTheDocument()
  expect(spinner.parentElement).not.toHaveClass(
    'absolute flex h-full w-full items-center justify-center'
  )
})
