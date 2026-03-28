'use client'
import { Editor } from '@/components/editor/Editor'
import { usePostSubmission } from '@/hooks/api/submissions/use-post-submission'
import { useForm } from 'react-hook-form'
import { editorSchema, EditorType } from '@/config/editor-config'
import { zodResolver } from '@hookform/resolvers/zod'
import { availableLanguages } from '@/consts/editor/languages'
import { TestCaseScreen } from '@/components/tests/TestCaseScreen'
import { useGetProblem } from '@/hooks/api/problems/use-get-problem'
import { ProblemProvider } from '@/contexts/problem/ProblemContext'
import { ExampleProps } from '@/components/problem/Example'
import { HintProps } from '@/components/problem/Hint'
import { Loader } from '@/components/loading/Loader'
import { Error } from '@/components/error/Error'
import { ProblemLinkProps } from '@/components/problem/ProblemLink'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useParams } from 'next/navigation'
import { useOnSocket } from '@/hooks/socket/use-on-socket'
import { ReactNode, useEffect, useState } from 'react'
import { socket } from '@/ws/socket'
import { LeftProblemNavbar } from '@/components/navbar/LeftProblemNavbar'
import { AiTutorAside } from '@/components/aside/AiTutorAside'
import { useGetAiTutorHistory } from '@/hooks/ai/use-get-ai-tutor-history'
import {
  AiSendMessageProvider,
  MessageDataProps,
} from '@/contexts/ai/AiSendMessageContext'
import {
  AiTutorContextProps,
  AiTutorContextProvider,
} from '@/contexts/ai/AiTutorContext'
import { AiAnalysisContextProvider } from '@/contexts/ai/AiAnalysisContext'
import { PrimaryProblemNavbar } from '@/components/navbar/PrimaryProblemNavbar'

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
  id: string
}

export default function ProblemLayout({ children }: { children: ReactNode }) {
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false)
  const defaultLanguage = availableLanguages[0]

  const [codeSnippet, setCodeSnippet] = useState<string>('')

  const { data: authData } = useAuth()

  useEffect(() => {
    if (!authData?.user.id) return
    socket.auth = { userId: authData.user.id }
    if (!socket.connected) {
      socket.connect()
    }
  }, [authData])

  const rooms = [
    'attempt_update',
    'test_result',
    'submission_complete',
    'submission_analyzed',
  ]

  const { problem } = useParams()

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
  } = useGetAiTutorHistory<Omit<AiTutorContextProps, 'sessionId'>>({
    problem: problem as string,
  })

  const { postMutation, data, loading, error } =
    usePostSubmission<SubmissionDataProps>()

  const { control, handleSubmit, watch, reset } = useForm<EditorType>({
    resolver: zodResolver(editorSchema),

    defaultValues: {
      language: defaultLanguage,
      blueprint: codeSnippet,
      code: codeSnippet,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  })

  const selectedLanguage = watch('language')
  const currentCode = watch('code')

  useEffect(() => {
    if (problemData) {
      const snippet = problemData.codeSnippets[selectedLanguage]
      setCodeSnippet(snippet)
      reset({
        language: selectedLanguage,
        blueprint: snippet,
        code: snippet,
      })
    }
  }, [problemData, selectedLanguage])

  if (problemLoading || tutorLoading) {
    return <Loader />
  }

  if (problemError) {
    return <Error {...problemError} />
  }
  if (tutorError) {
    return <Error {...tutorError} />
  }

  if (!problemData || !tutorData) return null

  const { messages: tutorMessages } = tutorData

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
  console.log(messages)
  return (
    <AiSendMessageProvider messageData={messageData}>
      <AiTutorContextProvider messages={tutorMessages}>
        <AiAnalysisContextProvider
          attemptId={messages?.attempt_update.attemptId}
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
                      attemptId={data?.id}
                      attemptMessages={messages}
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
        </AiAnalysisContextProvider>
      </AiTutorContextProvider>
    </AiSendMessageProvider>
  )
}
