'use client'
import { Editor } from '@/components/editor/Editor'
import { LeftProblemNavbar } from '@/components/navbar/LeftProblemNavbar'
import { PrimaryProblemNavbar } from '@/components/navbar/PrimaryProblemNavbar'
import { usePostSubmission } from '@/hooks/api/use-post-submission'
import { ReactNode, use, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { editorSchema, EditorType } from '@/config/editor-config'
import { zodResolver } from '@hookform/resolvers/zod'
import { availableLanguages, Languages } from '@/consts/editor/languages'
import {
  TestCaseScreen,
  TestCasesProps,
} from '@/components/tests/TestCaseScreen'
import { useGetProblem } from '@/hooks/api/use-get-problem'
import { ProblemContextProvider } from '@/contexts/ProblemContext'
import { ExampleProps } from '@/components/problem/Example'
import { HintProps } from '@/components/problem/Hint'
import { LanguagesRecord } from '@/consts/editor/languages'
import { Loader } from '@/components/loading/Loader'
import { Error } from '@/components/error/Error'

export interface ProblemContextProps {
  title: string
  problemId: number
  difficulty: string
  problemSlug: string
  topics: string[]
  description: string
  examples: ExampleProps[]
  hints: HintProps[]
  codeSnippets: LanguagesRecord
  testInputOutput: {
    input: string
    output: string
  }[]
}

export default function ProblemLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ problem: string }>
}) {
  const { postMutation, data, loading, error } = usePostSubmission()

  const { problem } = use(params)

  const {
    data: problemData,
    loading: problemLoading,
    error: problemError,
  } = useGetProblem<ProblemContextProps>({ problem })

  if (!problemData) return null
  const { codeSnippets, testInputOutput } = problemData

  if (problemLoading) {
    return <Loader />
  }
  if (problemError) {
    return <Error {...problemError} />
  }
  const defaultLanguage = availableLanguages[0]

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { dirtyFields },
  } = useForm<EditorType>({
    resolver: zodResolver(editorSchema),

    defaultValues: {
      language: defaultLanguage,
      blueprint: codeSnippets[defaultLanguage] || '',
      code: codeSnippets[defaultLanguage] || '',
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  })

  const selectedLanguage = watch('language')

  useEffect(() => {
    if (selectedLanguage && codeSnippets[selectedLanguage as Languages]) {
      const isCodeDirty = dirtyFields.code
      if (!isCodeDirty) {
        setValue('code', codeSnippets[selectedLanguage as Languages])
      }
      setValue('blueprint', codeSnippets[selectedLanguage as Languages])
    }
  }, [selectedLanguage, codeSnippets, setValue, dirtyFields.code])

  const onSubmit = (data: EditorType) => {
    postMutation({
      payload: {
        code: data.code,
        language: data.language,
      },
    })
  }

  return (
    <ProblemContextProvider
      problem={{ problemData, problemLoading, problemError }}
    >
      <form className="text-foreground flex h-screen flex-col">
        <PrimaryProblemNavbar
          onSubmit={handleSubmit(onSubmit)}
          submissionLoading={loading}
          submissionError={error}
        />
        <section className="flex flex-grow gap-4 overflow-hidden p-4">
          <div className="border-primary/20 flex w-3/5 flex-col rounded-lg border bg-transparent p-4">
            {/* <LeftProblemNavbar hasPassed={hasPassed} submitId={submitId} /> */}
            <div className="custom-scrollbar mt-4 overflow-y-auto">
              {children}
            </div>
          </div>
          <div className="flex w-3/5 flex-col gap-4">
            <div className="h-3/5">
              <Editor control={control} selectedLanguage={selectedLanguage} />
            </div>
            <div className="border-primary/20 h-2/5 rounded-lg border bg-transparent">
              <TestCaseScreen testInputOutput={testInputOutput} />/
            </div>
          </div>
        </section>
      </form>
    </ProblemContextProvider>
  )
}
