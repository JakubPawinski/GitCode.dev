'use client'
import { Editor } from '@/components/editor/Editor'
import { PrimaryProblemNavbar } from '@/components/navbar/PrimaryProblemNavbar'
import { usePostSubmission } from '@/hooks/api/use-post-submission'
import { useForm } from 'react-hook-form'
import { editorSchema, EditorType } from '@/config/editor-config'
import { zodResolver } from '@hookform/resolvers/zod'
import { availableLanguages } from '@/consts/editor/languages'
import { TestCaseScreen } from '@/components/tests/TestCaseScreen'
import { useGetProblem } from '@/hooks/api/use-get-problem'
import { ProblemProvider } from '@/contexts/problem/ProblemContext'
import { ExampleProps } from '@/components/problem/Example'
import { HintProps } from '@/components/problem/Hint'
import { Loader } from '@/components/loading/Loader'
import { Error } from '@/components/error/Error'
import { ProblemLinkProps } from '@/components/problem/ProblemLink'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useParams } from 'next/navigation'
import { TopicProps } from '@/components/problem/Topic'
import { useOnSocket } from '@/hooks/socket/use-on-socket'
import { useEffect } from 'react'
import { socket } from '@/ws/socket'

export interface ProblemDataProps {
  id: string
  title: string
  problemId: string
  difficulty: string
  problemSlug: string
  topics: TopicProps[]
  description: string
  examples: ExampleProps[]
  constraints: string[]
  hints: HintProps[]
  codeSnippets: any
  testCases: {
    input: string
    expectedOutput: string
  }[]
  similarProblems: ProblemLinkProps[]
}

export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: authData } = useAuth()

  if (!authData) return null

  // useEffect(() => {
  //   if (authData.user.id) {
  //     socket.auth = { userId: authData.user.id }
  //     socket.connect()
  //   }
  //   return () => {
  //     socket.disconnect()
  //   }
  // }, [authData.user.id])

  // const rooms = [
  //   'connect',
  //   'connect_error',
  //   // 'disconnect',
  //   'attempt-update',
  //   'test-result',
  //   'submission-complete',
  // ]

  const { problem } = useParams()

  // const { messages } = useOnSocket({ rooms, socket })

  // console.log(messages)

  const {
    data: problemData,
    loading: problemLoading,
    error: problemError,
  } = useGetProblem<ProblemDataProps>(problem as string)

  const { postMutation, data, loading, error } = usePostSubmission()

  const defaultLanguage = availableLanguages[0]

  const { control, handleSubmit, watch } = useForm<EditorType>({
    resolver: zodResolver(editorSchema),

    defaultValues: {
      language: defaultLanguage,
      blueprint: '',
      code: '',
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  })

  const selectedLanguage = watch('language')

  if (problemLoading) {
    return <Loader />
  }
  if (problemError) {
    return <Error {...problemError} />
  }
  if (!problemData) return null

  const { id, testCases } = problemData

  const onSubmit = (data: EditorType) => {
    postMutation({
      payload: {
        problemId: id,
        code: data.code,
        language: data.language,
      },
    })
  }

  return (
    <ProblemProvider problemData={problemData}>
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
              <TestCaseScreen testCases={testCases} />
            </div>
          </div>
        </section>
      </form>
    </ProblemProvider>
  )
}
