import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect } from 'vitest'
import {
  TestCaseScreen,
  TestCasesProps,
} from '@/components/tests/TestCaseScreen'

const mockTestCases = [
  { input: 'a', expectedOutput: 'b' },
  { input: 'c', expectedOutput: 'd' },
  { input: 'e', expectedOutput: 'f' },
  { input: 'g', expectedOutput: 'h' },
]

test('TestCaseScreen renders correctly with test cases', () => {
  render(<TestCaseScreen testCases={mockTestCases} />)

  expect(screen.getByText('Test Cases')).toBeInTheDocument()
  expect(screen.getByText('Case 1')).toBeInTheDocument()
  expect(screen.getByText('Case 2')).toBeInTheDocument()
  expect(screen.getByText('Case 3')).toBeInTheDocument()
  expect(screen.queryByText('Case 4')).not.toBeInTheDocument()

  // Check that the first test case is active
  expect(screen.getByText('Input:')).toBeInTheDocument()
  expect(screen.getByText('a')).toBeInTheDocument()
  expect(screen.getByText('Expected Output:')).toBeInTheDocument()
  expect(screen.getByText('b')).toBeInTheDocument()
})

test('TestCaseScreen switches tabs correctly', () => {
  render(<TestCaseScreen testCases={mockTestCases} />)

  fireEvent.click(screen.getByText('Case 2'))

  // Check that the second test case is active
  expect(screen.getByText('Input:')).toBeInTheDocument()
  expect(screen.getByText('c')).toBeInTheDocument()
  expect(screen.getByText('Expected Output:')).toBeInTheDocument()
  expect(screen.getByText('d')).toBeInTheDocument()
})

test('TestCaseScreen renders null if no test cases are provided', () => {
  const { container } = render(<TestCaseScreen testCases={[]} />)
  expect(container.firstChild).toBeNull()
})

test('TestCaseScreen renders null if testCases is undefined', () => {
  const { container } = render(
    <TestCaseScreen
      testCases={undefined as unknown as TestCasesProps['testCases']}
    />
  )
  expect(container.firstChild).toBeNull()
})
