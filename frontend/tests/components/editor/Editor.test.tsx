import { render, screen, fireEvent, renderHook } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { Editor } from '@/components/editor/Editor'
import { useForm } from 'react-hook-form'
import { EditorType } from '@/config/editor-config'

// Mock MonacoEditor and Loader
vi.mock('@monaco-editor/react', () => ({
  Editor: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (v: string) => void
  }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

vi.mock('../loading/Loader', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}))

const Wrapper = ({
  control,
  selectedLanguage,
}: {
  control: any
  selectedLanguage: string
}) => {
  return <Editor control={control} selectedLanguage={selectedLanguage} />
}

test('Editor renders correctly', () => {
  const { result } = renderHook(() => useForm<EditorType>())
  render(
    <Wrapper control={result.current.control} selectedLanguage="javascript" />
  )

  expect(screen.getByText('Code Editor')).toBeInTheDocument()
  expect(screen.getByRole('combobox')).toBeInTheDocument()
  expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
})

test('Editor changes language', () => {
  const { result } = renderHook(() =>
    useForm<EditorType>({ defaultValues: { language: 'javascript' } })
  )
  render(
    <Wrapper control={result.current.control} selectedLanguage="javascript" />
  )

  const select = screen.getByRole('combobox')
  fireEvent.change(select, { target: { value: 'python' } })

  expect(result.current.getValues('language')).toBe('python')
})

test('Editor updates code', () => {
  const { result } = renderHook(() =>
    useForm<EditorType>({ defaultValues: { code: 'console.log("hello")' } })
  )
  render(
    <Wrapper control={result.current.control} selectedLanguage="javascript" />
  )

  const editor = screen.getByTestId('monaco-editor')
  fireEvent.change(editor, { target: { value: 'print("hello")' } })

  expect(result.current.getValues('code')).toBe('print("hello")')
})
