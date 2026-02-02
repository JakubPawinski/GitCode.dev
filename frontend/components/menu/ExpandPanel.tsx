import { X } from 'lucide-react'
import { useProblemContext } from '@/contexts/problem/ProblemContext'
import { ProblemLink } from '../problem/ProblemLink'

export interface ExpandPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const ExpandPanel = ({ isOpen, onClose }: ExpandPanelProps) => {
  const { similarProblems } = useProblemContext()

  return (
    <div>
      <div
        className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`bg-background shadow-primary/20 fixed top-0 left-0 z-40 h-full w-full max-w-md transform shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="border-primary/10 flex items-center justify-between border-b p-4">
          <h2 className="text-foreground text-lg font-semibold">
            Similar Questions
          </h2>
          <div
            onClick={onClose}
            className="text-foreground/60 hover:bg-primary/10 hover:text-foreground rounded-full p-2 transition-colors"
            aria-label="Close panel"
          >
            <X size={24} />
          </div>
        </nav>

        <div className="h-[calc(100%-65px)] overflow-y-auto">
          {similarProblems.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4">
              <h1 className="text-foreground/60 text-center">
                No similar questions found for this problem.
              </h1>
            </div>
          ) : (
            <main className="space-y-2 p-4">
              {similarProblems.map((problemLink, index) => (
                <ProblemLink
                  key={`${problemLink.problemId}-${index}`}
                  {...problemLink}
                />
              ))}
            </main>
          )}
        </div>
      </aside>
    </div>
  )
}
