'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotepadText, Clock8 } from 'lucide-react'
import { SubmissionResultLink } from './SubmissionResultLink'
import { ChartNoAxesCombined } from 'lucide-react'
interface NavbarProps {
  testsPassed?: number
  totalTests?: number
  submissionId?: string
}

export const LeftProblemNavbar = ({
  testsPassed,
  totalTests,
  submissionId,
}: NavbarProps) => {
  const pathname = usePathname()
  const pathParts = pathname.split('/')
  const basePath = `/${pathParts[1]}/${pathParts[2]}`

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

      {submissionId && (
        <SubmissionResultLink
          submissionId={submissionId}
          testsPassed={testsPassed!}
          totalTests={totalTests!}
          basePath={basePath}
        />
      )}
    </nav>
  )
}
