import { api } from '@/api/axios'
import { useCallback, useEffect, useState } from 'react'

export interface TestResult {
  testIndex: number
  passed: boolean
  input: Record<string, any>
  expectedOutput: any
  actualOutput: any
  errorMessage: string | null
}

export interface AiFeedback {
  id: string
  submissionId: string
  attemptId: string
  feedbackType: string
  content: string
  severity: string
  createdAt: string
}

export interface AttemptDetails {
  id: string
  status: string
  passedTests: number
  failedTests: number
  totalTests: number
  executionTime: number | null
  memoryUsed: number | null
  createdAt: string
  completedAt: string | null
  feedbacks: AiFeedback | null
  testResults: TestResult[]
  failedTestsDetails: TestResult[]
}

export const useGetAttemptDetails = ({ attemptId }: { attemptId: string }) => {
  const [data, setData] = useState<AttemptDetails>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>()
  const controller = new AbortController()

  const getQuery = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get(`/submissions/attempts/${attemptId}`, { signal: controller.signal })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [attemptId])

  useEffect(() => {
    if (attemptId) getQuery()

    return () => controller.abort()
  }, [attemptId])

  return { data, loading, error }
}
