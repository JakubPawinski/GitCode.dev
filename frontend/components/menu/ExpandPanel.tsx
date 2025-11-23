import { ProblemLink, ProblemLinkProps } from '../problem/ProblemLink'
import { X } from 'lucide-react'
import { Error } from '../error/Error'
import { Loader } from '../loading/Loader'

export interface ExpandPanelProps {
  data?: ProblemLinkProps[]
  loading: boolean
  error: any
  isOpen: boolean
}
export const ExpandPanel = ({
  data,
  loading,
  error,
  isOpen,
}: ExpandPanelProps) => {
  if (loading) {
    return <Loader />
  }
  if (!isOpen) return null
  if (!data) return null
  return (
    <div>
      <nav>
        <h2>Questions</h2>
        <X />
      </nav>
      <main>
        {data.map((problemLink) => (
          <ProblemLink
            problemId={problemLink.problemId}
            problemSlug={problemLink.problemSlug}
            title={problemLink.title}
            difficulty={problemLink.difficulty}
          />
        ))}
      </main>
      {error && <Error {...error} />}
    </div>
  )
}
