import Link from 'next/link'
import Image from 'next/image'
import { ExpandPanel } from '../menu/ExpandPanel'
import { CloudUpload } from 'lucide-react'
import { SquareMenu } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'
import { Brain } from 'lucide-react'
import { ProfileLink } from './ProfileLink'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useParams } from 'next/navigation'
import { useGetAiTutorHistory } from '@/hooks/ai/use-get-ai-tutor-history'
import {
  AiTutorContextProps,
  AiTutorContextProvider,
} from '@/contexts/ai/AiTutorContext'
interface NavbarSubmitProps {
  onSubmit: () => void
  setAiTutorOpen: Dispatch<SetStateAction<boolean>>
  submissionLoading: boolean
  submissionError: any
}
export const PrimaryProblemNavbar = ({
  onSubmit,
  setAiTutorOpen,
  submissionLoading,
  submissionError,
}: NavbarSubmitProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { data } = useAuth()

  if (!data) return null

  const { user } = data
  const { problem } = useParams()

  const {
    data: tutorData,
    loading: tutorLoading,
    error: tutorError,
  } = useGetAiTutorHistory<AiTutorContextProps>({ problem: problem as string })

  if (tutorLoading) return <Loader />
  if (tutorError) return <Error {...tutorError} />
  if (!tutorData) return null

  return (
    <AiTutorContextProvider messages={tutorData.messages}>
      <nav className="border-primary/30 grid h-22 grid-cols-3 items-center border-b bg-transparent px-4 shadow-lg">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-primary hover:text-accent flex items-center transition-all duration-300"
          >
            <Image
              alt="logo"
              src={'/logo.png'}
              width={48}
              height={48}
              className="rounded-md"
            />
            <span className="text-xl font-bold">GitCode.dev</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground hover:text-accent gap-2 transition-colors"
          >
            <ExpandPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <div className="flex cursor-pointer items-center gap-2">
              <SquareMenu />
              <p className="font-semibold tracking-wider">Questions</p>
            </div>
          </button>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onSubmit}
            disabled={submissionLoading}
            className="from-primary to-accent text-foreground transform rounded-lg bg-gradient-to-r px-2 py-1 font-bold shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!submissionLoading ? (
              <div className="flex cursor-pointer items-center gap-2 p-1">
                <CloudUpload size={20} />
                <span>Submit</span>
              </div>
            ) : (
              <Loader />
            )}
          </button>
          <div
            className="text-foreground hover:text-accent flex cursor-pointer items-center gap-2 transition-colors"
            onClick={() => setAiTutorOpen((previous: boolean) => !previous)}
          >
            <Brain size={24} />
            <div className="font-semibold tracking-wider">AI Tutor</div>
          </div>
        </div>
        <div className="flex justify-end">
          <ProfileLink {...user} />
        </div>
        {submissionError && <Error {...submissionError} />}
      </nav>
    </AiTutorContextProvider>
  )
}
