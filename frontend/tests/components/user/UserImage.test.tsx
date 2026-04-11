import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import { UserImage } from '@/components/user/UserImage'

test('UserImage renders Image when src is provided', () => {
  render(
    <UserImage src="https://example.com/image.png" width={40} height={40} />
  )
  const image = screen.getByAltText('user-image')
  expect(image).toBeInTheDocument()
  expect(image).toHaveAttribute('src', 'https://example.com/image.png')
})

test('UserImage renders User icon when src is not provided', () => {
  render(<UserImage width={40} height={40} />)
  const userIcon = screen.getByRole('img', { hidden: true })
  expect(userIcon).toBeInTheDocument()
})

test('UserImage applies className', () => {
  render(
    <UserImage
      src="https://example.com/image.png"
      width={40}
      height={40}
      className="test-class"
    />
  )
  const image = screen.getByAltText('user-image')
  expect(image).toHaveClass('test-class')
})
