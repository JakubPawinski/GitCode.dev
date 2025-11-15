import Link from 'next/link'
import { ExpandPanel } from '../menu/ExpandPanel'
import { CloudUpload, House } from 'lucide-react'
import { SquareMenu } from 'lucide-react'
import { useState } from 'react'
import { useGetTasks } from '@/hooks/api/use-get-tasks'
import { TaskProps } from '../tasks/Task'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'
import { Brain } from 'lucide-react'
interface NavbarSubmitProps {
  onSubmit: () => void
  submissionLoading: boolean
  submissionError: any
}
export const PrimaryNavbar = ({
  onSubmit,
  submissionLoading,
  submissionError,
}: NavbarSubmitProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { data, loading, error } = useGetTasks<TaskProps[]>()

  return (
    <nav className="align-items-center flex justify-between">
      <div>
        <button onClick={() => setIsOpen(!isOpen)}>
          <ExpandPanel
            isOpen={isOpen}
            data={data}
            loading={loading}
            error={error}
          />
          <SquareMenu />
          <p>Questions</p>
        </button>
      </div>
      <div>
        <Link href="/">
          <House />
        </Link>
      </div>
      <div className="flex">
        <button onClick={onSubmit} disabled={submissionLoading}>
          {!submissionLoading ? (
            <div>
              <CloudUpload />
              <span>Submit</span>
            </div>
          ) : (
            <Loader />
          )}
        </button>
        <div>
          <Brain />
          <div>AI Tutor</div>
        </div>
      </div>
      <div>
        <Link href={'/profile'}>Profile</Link>
      </div>
      {submissionError && <Error {...submissionError} />}
    </nav>
  )
}
