import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { Loader } from '../loading/Loader'
interface AttemptResultLinkProps {
  basePath: string
  status: string
  attemptId: string
}

export const AttemptResultLink = ({
  status,
  attemptId,
  basePath,
}: AttemptResultLinkProps) => {
  const normalizedStatus = status?.toLowerCase()
  const isRunning = normalizedStatus === 'running'
  const isPassed =
    normalizedStatus === 'success' || normalizedStatus === 'passed'
  const isFailed = normalizedStatus === 'failed'

  const label = isRunning
    ? 'Running'
    : isPassed
      ? 'Passed'
      : isFailed
        ? 'Failed'
        : status
  const accentClass = isRunning
    ? 'text-primary'
    : isPassed
      ? 'text-emerald-400'
      : isFailed
        ? 'text-red-400'
        : 'text-foreground/70'

  return (
    <Link
      href={`${basePath}/attempts/${attemptId}`}
      className={`hover:text-foreground flex items-center gap-2 rounded-md px-4 py-2 transition-all duration-300 ${accentClass}`}
    >
      {isRunning ? (
        <div className="grid place-items-center">
          <Loader size={18} center={false} />
        </div>
      ) : isPassed ? (
        <Check size={18} />
      ) : isFailed ? (
        <X size={18} />
      ) : null}
      <span className="text-sm font-semibold tracking-wide">{label}</span>
    </Link>
  )
}
