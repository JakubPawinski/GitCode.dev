import { X } from 'lucide-react'
import { useProblemContext } from '@/contexts/problem/ProblemContext'

export interface ExpandPanelProps {
  isOpen: boolean
}
export const ExpandPanel = ({ isOpen }: ExpandPanelProps) => {
  const problemData = useProblemContext()

  if (!isOpen) return null

  return (
    <div>
      <nav>
        <h2>Questions</h2>
        <X />
      </nav>
      <main>
        {/* {similarProblems.map((problemLink) => (
          <ProblemLink {...problemLink} />
        ))} */}
      </main>
    </div>
  )
}
