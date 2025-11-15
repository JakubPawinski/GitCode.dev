'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotepadText } from 'lucide-react'
import { Clock8 } from 'lucide-react'

interface NavbarProps {
  hasPassed?: boolean
  submitId?: string
}

export const LeftNavbar = ({ hasPassed, submitId }: NavbarProps) => {
  const pathname = usePathname()
  const descLength = 14
  const croppedPathname = pathname.slice(0, descLength)
  return (
    <nav>
      <Link href={`${croppedPathname}`}>
        <NotepadText />
        <div>Description</div>
      </Link>
      {hasPassed !== undefined && (
        <Link href={`${croppedPathname}/submissions/${submitId}`}>
          {hasPassed ? 'Good answer' : 'Wrong answer'}
        </Link>
      )}
      <Link href={`${croppedPathname}/submissions`}>
        <Clock8 />
        <div>Submissions</div>
      </Link>
    </nav>
  )
}
