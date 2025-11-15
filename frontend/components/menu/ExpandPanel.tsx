import { Task, TaskProps } from '../tasks/Task'
import { X } from 'lucide-react'
import Link from 'next/link'
import { Error } from '../error/Error'
import { Loader } from '../loading/Loader'

export interface ExpandPanelProps {
  data?: TaskProps[]
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
  if (error) {
    return <Error {...error} />
  }
  return (
    <div
      className={`transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <nav>
        <h2>Questions</h2>
        <X />
      </nav>
      <main>
        {data?.map((task) => (
          <Link
            href={`/tasks/` + task.taskTitle}
            key={task.taskNumber}
            prefetch
          >
            <Task
              taskNumber={task.taskNumber}
              taskTitle={task.taskTitle}
              taskDifficulty={task.taskDifficulty}
              isCompleted={task.isCompleted}
            />
          </Link>
        ))}
      </main>
    </div>
  )
}
