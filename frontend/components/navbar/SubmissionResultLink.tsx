import { Check, X } from 'lucide-react'
import Link from 'next/link'
export const SubmissionResultLink = ({
  submissionId,
  testsPassed,
  totalTests,
  basePath,
}: {
  submissionId: string
  testsPassed: number
  totalTests: number
  basePath: string
}) => {
  const allPassed = totalTests > 0 && testsPassed === totalTests

  const resultText = allPassed ? 'Accepted' : 'Wrong Answer'
  const resultColor = allPassed ? 'text-emerald-400' : 'text-red-400'

  return (
    <Link
      href={`${basePath}/submissions/${submissionId}`}
      className={
        'text-foreground/70 hover:text-foreground flex items-center gap-2 rounded-md px-4 py-2 transition-all duration-300'
      }
    >
      <div className={`flex items-center gap-1.5 font-semibold ${resultColor}`}>
        {allPassed ? <Check size={18} /> : <X size={18} />}
        <span>{resultText}</span>
      </div>
    </Link>
  )
}
