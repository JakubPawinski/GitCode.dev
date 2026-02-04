'use client'

import { Error } from '@/components/error/Error'
import { Loader } from '@/components/loading/Loader'
import {
  useGetAttemptDetails,
  TestResult,
} from '@/hooks/api/use-get-attempt-details'
import { useParams } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function SubmissionPage() {
  const { submissionId } = useParams()

  const { data, loading, error } = useGetAttemptDetails(submissionId as string)

  if (loading) return <Loader />
  if (error) return <Error {...error} />
  if (!data) return null

  const isSuccess = data.status === 'success'
  const passRate =
    data.totalTests > 0
      ? ((data.passedTests / data.totalTests) * 100).toFixed(1)
      : '0'

  return (
    <div className="space-y-6 p-4">
      {/* Status Header */}
      <div
        className={`rounded-lg p-6 ${
          isSuccess
            ? 'border border-emerald-500/20 bg-emerald-500/10'
            : 'border border-red-500/20 bg-red-500/10'
        }`}
      >
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          ) : (
            <XCircle className="h-8 w-8 text-red-400" />
          )}
          <div>
            <h1
              className={`text-2xl font-bold ${
                isSuccess ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isSuccess ? 'Accepted' : 'Wrong Answer'}
            </h1>
            <p className="text-foreground/60 text-sm">
              {data.passedTests}/{data.totalTests} test cases passed ({passRate}
              %)
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Runtime"
          value={data.executionTime ? `${data.executionTime} ms` : 'N/A'}
        />
        <StatCard
          icon={<Database className="h-5 w-5" />}
          label="Memory"
          value={data.memoryUsed ? `${data.memoryUsed} MB` : 'N/A'}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
          label="Passed"
          value={`${data.passedTests}`}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          label="Failed"
          value={`${data.failedTests}`}
        />
      </div>

      {/* Timestamps */}
      <div className="bg-primary/5 flex items-center gap-6 rounded-lg p-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="text-foreground/60 h-4 w-4" />
          <span className="text-foreground/60">Submitted:</span>
          <span>{new Date(data.createdAt).toLocaleString()}</span>
        </div>
        {data.completedAt && (
          <div className="flex items-center gap-2">
            <Clock className="text-foreground/60 h-4 w-4" />
            <span className="text-foreground/60">Completed:</span>
            <span>{new Date(data.completedAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* AI Feedback */}
      {data.feedbacks && (
        <div className="bg-primary/5 rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5" />
            AI Feedback
          </h2>
          <div
            className={`rounded-lg p-3 ${
              data.feedbacks.severity === 'ERROR'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-blue-500/10 text-blue-400'
            }`}
          >
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mt-4 mb-2 text-lg font-bold">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-3 mb-2 text-base font-bold">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-2 mb-1 text-sm font-bold">{children}</h3>
                  ),
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="mb-2 list-inside list-disc space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 list-inside list-decimal space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  code: ({ children, className }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className="bg-background/50 rounded px-1.5 py-0.5 text-xs text-emerald-400">
                        {children}
                      </code>
                    ) : (
                      <code className="bg-background/50 my-2 block overflow-x-auto rounded p-3 text-xs">
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => (
                    <pre className="bg-background/50 my-2 overflow-x-auto rounded p-3">
                      {children}
                    </pre>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-white">{children}</strong>
                  ),
                }}
              >
                {data.feedbacks.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Failed Tests Details */}
      {data.failedTestsDetails.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-400">Failed Tests</h2>
          {data.failedTestsDetails.map((test) => (
            <TestResultCard key={test.testIndex} test={test} />
          ))}
        </div>
      )}

      {/* All Test Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Test Results</h2>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {data.testResults.map((test) => (
            <TestResultRow key={test.testIndex} test={test} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-primary/5 rounded-lg p-4">
      <div className="text-foreground/60 mb-2 flex items-center gap-2 text-sm">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}

function TestResultRow({ test }: { test: TestResult }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg p-3 ${
        test.passed ? 'bg-emerald-500/5' : 'bg-red-500/5'
      }`}
    >
      <div className="flex items-center gap-3">
        {test.passed ? (
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
        <span className="text-foreground/80">
          Test Case {test.testIndex + 1}
        </span>
      </div>
      <span
        className={`text-sm font-medium ${
          test.passed ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {test.passed ? 'Passed' : 'Failed'}
      </span>
    </div>
  )
}

function TestResultCard({ test }: { test: TestResult }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <XCircle className="h-5 w-5 text-red-400" />
        <span className="font-semibold">Test Case {test.testIndex + 1}</span>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-foreground/60">Input:</span>
          <pre className="bg-background/50 mt-1 overflow-x-auto rounded p-2">
            {JSON.stringify(test.input, null, 2)}
          </pre>
        </div>
        <div>
          <span className="text-foreground/60">Expected:</span>
          <pre className="bg-background/50 mt-1 overflow-x-auto rounded p-2">
            {JSON.stringify(test.expectedOutput, null, 2)}
          </pre>
        </div>
        <div>
          <span className="text-foreground/60">Actual:</span>
          <pre className="bg-background/50 mt-1 overflow-x-auto rounded p-2">
            {JSON.stringify(test.actualOutput, null, 2)}
          </pre>
        </div>
        {test.errorMessage && (
          <div>
            <span className="text-red-400">Error:</span>
            <pre className="mt-1 overflow-x-auto rounded bg-red-500/10 p-2 text-red-400">
              {test.errorMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
