import Link from 'next/link'
import { ExpandPanel } from '../menu/ExpandPanel'
import { CloudUpload } from 'lucide-react'
import { SquareMenu } from 'lucide-react'
import { useState } from 'react'
import { useGetProblems } from '@/hooks/api/use-get-problems'
import { ProblemLinkProps } from '../problem/ProblemLink'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'
import { Brain } from 'lucide-react'
interface NavbarSubmitProps {
  onSubmit: () => void
  submissionLoading: boolean
  submissionError: any
}
export const PrimaryProblemNavbar = ({
  onSubmit,
  submissionLoading,
  submissionError,
}: NavbarSubmitProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <nav className="border-primary/30 flex h-16 items-center justify-between border-b bg-transparent px-6 shadow-lg">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-primary hover:text-accent text-2xl font-bold transition-all duration-300"
        >
          GitCode.dev
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-foreground hover:text-accent flex items-center gap-2 transition-colors"
        >
          <ExpandPanel
            isOpen={isOpen}
            data={data}
            loading={loading}
            error={error}
          />
          <div className="flex items-center gap-2">
            <SquareMenu />
            <p className="font-semibold tracking-wider">Questions</p>
          </div>
        </button>
      </div>
      <div className="flex items-center gap-6">
        <button
          onClick={onSubmit}
          disabled={submissionLoading}
          className="from-primary to-accent text-foreground transform rounded-lg bg-gradient-to-r px-5 py-2 font-bold shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {!submissionLoading ? (
            <div className="flex cursor-pointer items-center gap-2">
              <CloudUpload size={20} />
              <span>SUBMIT</span>
            </div>
          ) : (
            <Loader />
          )}
        </button>
        <div className="text-foreground hover:text-accent flex cursor-pointer items-center gap-2 transition-colors">
          <Brain size={24} />
          <div className="font-semibold tracking-wider">AI Tutor</div>
        </div>
      </div>
      <div>
        <Link
          href={'/profile'}
          className="text-foreground hover:text-accent font-semibold tracking-wider transition-colors"
        >
          Profile
        </Link>
      </div>
      {submissionError && <Error {...submissionError} />}
    </nav>
  )
}
