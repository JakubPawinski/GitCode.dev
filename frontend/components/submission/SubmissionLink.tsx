import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Code,
  Calendar,
  Clock,
  Database,
  Timer,
} from 'lucide-react'
import { useParams, usePathname } from 'next/navigation'

export interface SubmissionLinkProps {
  id: string
  language: string
  status: string
  submittedAt: string
  executionTime?: number
  memoryUsed?: number
  submissionNumber: number
}

export const SubmissionLink = ({
  id,
  language,
  status,
  submittedAt,
  executionTime,
  memoryUsed,
  submissionNumber,
}: SubmissionLinkProps) => {
  const isAccepted = status.toLowerCase() === 'accepted'
  const { problem } = useParams()
  return (
    <Link
      href={`/problems/${problem}/submissions/${id}`}
      className="hover:bg-primary/10 hover:border-primary/20 flex items-center justify-around gap-4 rounded-lg border border-transparent p-4 transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-center gap-6">
        <div>{submissionNumber}</div>
        <div
          className={`flex w-32 items-center gap-2 font-semibold ${
            isAccepted ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isAccepted ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span>{status}</span>
        </div>
        <div className="text-foreground/80 hidden items-center gap-2 sm:flex">
          <span className="bg-primary/10 inline-block min-w-[100px] rounded-md px-2 py-1 text-center text-sm font-medium">
            {language}
          </span>
        </div>
      </div>

      <div className="text-foreground/60 flex items-center gap-4 text-xs">
        <div className="hidden items-center gap-1.5 md:flex">
          <Timer size={14} />
          <span>
            {executionTime ? `${executionTime.toFixed(2)} ms` : 'N/A'}
          </span>
        </div>
        <div className="hidden items-center gap-1.5 lg:flex">
          <Database size={14} />
          <span>{memoryUsed ? `${memoryUsed.toFixed(2)} MB` : 'N/A'}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{submittedAt?.split('T')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{submittedAt?.split('T')[1].substring(0, 8)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
