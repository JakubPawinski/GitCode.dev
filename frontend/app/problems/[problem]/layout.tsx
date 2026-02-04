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
import { useOnSocket } from '@/hooks/socket/use-on-socket'
import { useEffect, useState } from 'react'
import { socket } from '@/ws/socket'
import { LeftProblemNavbar } from '@/components/navbar/LeftProblemNavbar'
import { AiTutorAside } from '@/components/aside/AiTutorAside'
import { useGetAiTutorHistory } from '@/hooks/api/use-get-ai-tutor-history'
import {
  AiSendMessageProvider,
  MessageDataProps,
} from '@/contexts/ai/AiSendMessageContext'
import { AiTutorContextProvider } from '@/contexts/ai/AiTutorContext'

export interface ProblemDataProps {
  id: string
  title: string
  problemId: string
  difficulty: string
  problemSlug: string
  topics: string[]
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

interface SubmissionDataProps {
  submissionId: string
}

export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false)
  const defaultLanguage = availableLanguages[0]

  const { data: authData } = useAuth()

  useEffect(() => {
    if (!authData?.user.id) return
    socket.auth = { userId: authData.user.id }
    if (!socket.connected) {
      socket.connect()
    }
  }, [authData?.user.id])

  const rooms = [
    'attempt_update',
    'test_result',
    'submission_complete',
    'submission_analyzed',
  ]

  const params = useParams()
  const problem = params.problem as string

  const { messages } = useOnSocket({ rooms, socket })

  const {
    data: problemData,
    loading: problemLoading,
    error: problemError,
  } = useGetProblem<ProblemDataProps>(problem as string)

  const {
    data: tutorData,
    loading: tutorLoading,
    error: tutorError,
  } = useGetAiTutorHistory({ problem })

  const { postMutation, data, loading, error } =
    usePostSubmission<SubmissionDataProps>()

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
  const currentCode = watch('code')

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
  const messageData: Partial<MessageDataProps> = {
    code: currentCode,
    problemSlug: problem as string,
  }

  return (
    <AiSendMessageProvider messageData={messageData}>
      <AiTutorContextProvider
        tutorData={
          tutorData as {
            messages: {
              role: string
              content: string
            }[]
          }
        }
        messageLoading={tutorLoading}
        messageError={tutorError}
      >
        <ProblemProvider problemData={problemData}>
          <div className="flex h-screen overflow-hidden">
            <form className="text-foreground flex h-screen flex-1 flex-col">
              <PrimaryProblemNavbar
                onSubmit={handleSubmit(onSubmit)}
                setAiTutorOpen={setAiTutorOpen}
                submissionLoading={loading}
                submissionError={error}
              />
              <section className="flex flex-grow gap-4 overflow-hidden p-4">
                <div className="border-primary/20 flex min-w-0 flex-1 flex-col rounded-lg border bg-transparent p-4">
                  <LeftProblemNavbar
                    submissionId={data?.submissionId}
                    submissionMessages={messages}
                  />
                  <div className="custom-scrollbar mt-4 overflow-y-auto">
                    {children}
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <div className="h-3/5">
                    <Editor
                      control={control}
                      selectedLanguage={selectedLanguage}
                    />
                  </div>
                  <div className="border-primary/20 h-2/5 rounded-lg border bg-transparent">
                    <TestCaseScreen testCases={testCases} />
                  </div>
                </div>
              </section>
            </form>
            {aiTutorOpen && <AiTutorAside />}
          </div>
        </ProblemProvider>
      </AiTutorContextProvider>
    </AiSendMessageProvider>
  )
}
