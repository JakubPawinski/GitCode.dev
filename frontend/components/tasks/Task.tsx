import { ThumbsUp } from 'lucide-react'
export interface TaskProps {
  isSelected?: boolean
  isCompleted?: boolean
  taskNumber: number
  taskTitle: string
  taskDifficulty: string
}
export const Task = ({
  taskNumber,
  taskTitle,
  taskDifficulty,
  isCompleted,
}: TaskProps) => {
  return (
    <a>
      <div>
        {isCompleted && <ThumbsUp />}
        <div>{taskNumber}.</div>
        <div>{taskTitle}</div>
      </div>
      <div>{taskDifficulty}</div>
    </a>
  )
}
