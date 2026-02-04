'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotepadText, Clock8, Sparkles } from 'lucide-react'
import { SubmissionResultLink } from './SubmissionResultLink'
import { ChartNoAxesCombined } from 'lucide-react'

interface NavbarProps {
  submissionId?: string
  submissionMessages: any
}

export const LeftProblemNavbar = ({
  submissionId,
  submissionMessages,
}: NavbarProps) => {
  const pathname = usePathname()
  const pathParts = pathname.split('/')
  const basePath = `/${pathParts[1]}/${pathParts[2]}`

  const status =
    submissionMessages?.submission_complete?.status ??
    submissionMessages?.submission_analyzed?.status ??
    submissionMessages?.attempt_update?.status

  // Fetch AI analysis attempt ID
  const aiAnalysis = submissionMessages?.submission_analyzed
  const hasAiAnalysis = !!aiAnalysis?.attemptId

  const linkClasses =
    'flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-foreground rounded-md transition-all duration-300'

  return (
    <nav className="border-primary/30 flex items-center gap-4 border-b bg-transparent p-3">
      <Link href={`${basePath}/description`} className={linkClasses}>
        <NotepadText size={20} />
        <span className="tracking-wide">Description</span>
      </Link>

      <Link href={`${basePath}/submissions`} className={linkClasses}>
        <Clock8 size={20} />
        <span className="tracking-wide">Submissions</span>
      </Link>
      <Link href={`${basePath}/stats`} className={linkClasses}>
        <ChartNoAxesCombined size={20} />
        <span className="tracking-wide">Stats</span>
      </Link>

      {submissionId && status && (
        <SubmissionResultLink
          basePath={basePath}
          status={status}
          submissionId={submissionId}
        />
      )}

      {hasAiAnalysis && (
        <Link
          href={`${basePath}/submissions/${aiAnalysis.attemptId}`}
          className="flex items-center gap-2 rounded-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-4 py-2 text-purple-400 transition-all duration-300 hover:from-purple-500/30 hover:to-blue-500/30"
          title="View AI Analysis"
        >
          <Sparkles size={20} className="animate-pulse" />
          <span className="tracking-wide">AI Analysis</span>
        </Link>
      )}
    </nav>
  )
}
