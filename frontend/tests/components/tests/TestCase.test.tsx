import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import { TestCase } from '@/components/tests/TestCase'

const mockTestCase = {
  input: '{"nums": [2, 7, 11, 15], "target": 9}',
  expectedOutput: '[0, 1]',
}

const mockTestCaseString = {
  input: 'hello',
  expectedOutput: 'world',
}

test('TestCase renders correctly with JSON input', () => {
  render(<TestCase testCase={mockTestCase} />)

  expect(screen.getByText('Input:')).toBeInTheDocument()
  expect(screen.getByText('nums = [2,7,11,15], target = 9')).toBeInTheDocument()
  expect(screen.getByText('Expected Output:')).toBeInTheDocument()
  expect(screen.getByText('[0,1]')).toBeInTheDocument()
})

test('TestCase renders correctly with string input', () => {
  render(<TestCase testCase={mockTestCaseString} />)

  expect(screen.getByText('Input:')).toBeInTheDocument()
  expect(screen.getByText('hello')).toBeInTheDocument()
  expect(screen.getByText('Expected Output:')).toBeInTheDocument()
  expect(screen.getByText('world')).toBeInTheDocument()
})
