'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotepadText } from 'lucide-react'
import { Clock8 } from 'lucide-react'

interface NavbarProps {
  hasPassed?: boolean
  submitId?: string
}

export const LeftProblemNavbar = ({ hasPassed, submitId }: NavbarProps) => {
  const pathname = usePathname()
  const descLength = 14
  const croppedPathname = pathname.slice(0, descLength)

  const linkClasses =
    'flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-foreground rounded-md transition-all duration-300'
  const activeLinkClasses =
    'bg-gradient-to-r from-primary/30 to-accent/30 text-accent font-semibold shadow-lg'

  return (
    <nav className="border-primary/30 flex items-center gap-4 border-b bg-transparent p-3">
      <Link
        href={`${croppedPathname}`}
        className={`${linkClasses} ${pathname === croppedPathname ? activeLinkClasses : ''}`}
      >
        <NotepadText size={20} />
        <span className="tracking-wide">Description</span>
      </Link>
      {hasPassed !== undefined && (
        <Link
          href={`${croppedPathname}/submissions/${submitId}`}
          className={`${linkClasses} ${pathname.includes('submissions/') && pathname.endsWith(submitId || '') ? activeLinkClasses : ''}`}
        >
          <span className={hasPassed ? 'text-success' : 'text-error'}>
            {hasPassed ? '✓ Accepted' : '✗ Wrong Answer'}
          </span>
        </Link>
      )}
      <Link
        href={`${croppedPathname}/submissions`}
        className={`${linkClasses} ${pathname.endsWith('submissions') ? activeLinkClasses : ''}`}
      >
        <Clock8 size={20} />
        <span className="tracking-wide">Submissions</span>
      </Link>
    </nav>
  )
}
