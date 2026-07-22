import { ClipLoader } from 'react-spinners'

export interface SubmissionProps {
  data?: {
    solution: string
    input: {
      [key: string]: string
    }[]
    output: string
    expected: string
    testsPassed: number
    testCount: number
  }
  loading: boolean
  error: any
}
export const Submission = ({ data, loading, error }: SubmissionProps) => {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <ClipLoader className="text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-accent/20 m-4 rounded-lg p-4 text-red-400">
        <h2 className="font-bold">Error</h2>
        <p>{error.message || 'An unexpected error occurred.'}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { input, output, expected, testsPassed, testCount } = data
  const allTestsPassed = testsPassed === testCount

  return (
    <main className="space-y-6 p-4">
      <div
        className={`rounded-lg p-4 ${
          allTestsPassed
            ? 'bg-primary/20 text-green-400'
            : 'bg-accent/20 text-red-400'
        }`}
      >
        <h1 className="text-2xl font-bold">
          {allTestsPassed ? 'Accepted' : 'Wrong Answer'}
        </h1>
        <p className="font-semibold">
          {testsPassed} / {testCount} tests passed
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-foreground text-lg font-semibold">Input</h2>
          <div className="text-foreground/80 bg-background/30 rounded-lg p-3 font-mono text-sm">
            {input.map((arg) => (
              <div key={arg.key}>
                {arg.key} = {arg.value}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-foreground text-lg font-semibold">Output</h2>
          <div className="text-foreground/80 bg-background/30 rounded-lg p-3 font-mono text-sm">
            {output}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-foreground text-lg font-semibold">Expected</h2>
          <div className="text-foreground/80 bg-background/30 rounded-lg p-3 font-mono text-sm">
            {expected}
          </div>
        </div>
      </div>
    </main>
  )
}
