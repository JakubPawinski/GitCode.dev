'use client'
import { Error } from '@/components/error/Error'
import { Loader } from '@/components/loading/Loader'
import {
  SubmissionLink,
  SubmissionLinkProps,
} from '@/components/submission/SubmissionLink'
import { useGetSubmissions } from '@/hooks/api/use-get-submissions'
import { useParams } from 'next/navigation'

interface DataProps {
  attempts: SubmissionLinkProps[]
}

export default function SubmissionsPage() {
  const { problem } = useParams()

  const { data, loading, error } = useGetSubmissions<DataProps>({
    problem: problem as string,
  })

  if (loading) return <Loader />
  if (error) return <Error {...error} />
  if (!data) return null
  const { attempts } = data
  if (attempts.length === 0) {
    return (
      <div className="bg-primary/5 flex h-48 items-center justify-center rounded-lg p-6 shadow-inner">
        <p className="text-foreground/70 text-lg font-semibold">
          You have no submissions for this problem yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <header className="bg-primary/5 text-foreground/80 flex items-center justify-around rounded-lg p-4 font-semibold">
        <div className="flex gap-36">
          <div>Status</div>
          <div>Language</div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden text-center md:block">Runtime</div>
          <div className="hidden text-center lg:block">Memory</div>
          <div className="text-right">Submitted</div>
        </div>
      </header>

      <main>
        {attempts?.map((submission, index) => (
          <SubmissionLink
            key={submission.id}
            {...submission}
            submissionNumber={attempts.length - index}
          />
        ))}
      </main>
    </div>
  )
}
