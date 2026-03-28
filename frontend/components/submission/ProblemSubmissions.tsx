'use client'
import { availableLanguages } from '@/consts/editor/languages'
import { useGetSubmissions } from '@/hooks/api/submissions/use-get-submissions'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'

interface ProblemSubmissionsProps {
  submissions: {
    attempt: number
    status: {
      state: string
      submissionDate: Date
    }
    language: string
    runtime: number
    memory: number
  }[]
}
export const ProblemSubmissions = ({ problem }: { problem: string }) => {
  const { data, loading, error } = useGetSubmissions<ProblemSubmissionsProps>({
    problem,
  })
  if (loading) {
    return <Loader />
  }
  if (error) {
    return <Error {...error} />
  }
  if (!data) return null
  const { submissions } = data
  return (
    <div className="from-background to-primary/5 text-foreground border-primary/20 rounded-xl border bg-gradient-to-b p-6 shadow-2xl backdrop-blur-sm">
      <header className="border-primary/30 mb-6 flex items-center justify-between border-b pb-4">
        <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
          Submissions
        </h1>
        <select
          name="language"
          defaultValue={availableLanguages[0]}
          className="bg-primary/10 border-primary/30 text-foreground focus:ring-accent rounded-md border px-3 py-2 transition-all focus:ring-2 focus:outline-none"
        >
          {availableLanguages.map((language) => (
            <option
              key={language}
              value={language}
              className="bg-background text-foreground"
            >
              {language}
            </option>
          ))}
        </select>
      </header>
      <main className="space-y-4">
        {submissions.map((submission) => (
          <div
            key={submission.attempt}
            className="bg-primary/10 hover:border-accent flex transform items-center justify-between rounded-lg border border-transparent p-4 shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold ${submission.status.state === 'Accepted' ? 'to-accent/30 from-green-500/30 text-green-300' : 'to-accent/30 from-red-500/30 text-red-300'}`}
              >
                {submission.attempt}
              </div>
              <div>
                <div
                  className={`text-lg font-bold ${submission.status.state === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {submission.status.state}
                </div>
                <div className="text-foreground/60 text-sm">
                  {new Date(submission.status.submissionDate).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8 text-right">
              <div className="text-base">
                <div className="font-semibold tracking-wider">
                  {submission.language}
                </div>
              </div>
              <div>
                <div className="text-base font-semibold">
                  {submission.runtime} ms
                </div>
                <div className="text-foreground/60 text-xs tracking-widest">
                  RUNTIME
                </div>
              </div>
              <div>
                <div className="text-base font-semibold">
                  {submission.memory} MB
                </div>
                <div className="text-foreground/60 text-xs tracking-widest">
                  MEMORY
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
