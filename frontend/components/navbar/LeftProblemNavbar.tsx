'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotepadText, Clock8, Sparkles } from 'lucide-react'
import { SubmissionResultLink } from './SubmissionResultLink'
import { ChartNoAxesCombined } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePostCommit } from '@/hooks/api/use-post-commit'
import { useAiSendMessageContext } from '@/contexts/ai/AiSendMessageContext'
import { useAuth } from '@/contexts/auth/AuthContext'

interface NavbarProps {
  submissionId?: string
  submissionMessages: any
  onCommitConfirm?: (submissionId: string, commitMessage?: string) => void
}

export const LeftProblemNavbar = ({
  submissionId,
  submissionMessages,
  onCommitConfirm,
}: NavbarProps) => {
  const { postMutation, data, loading, error } = usePostCommit()
  const auth = useAuth()
  const { messageData } = useAiSendMessageContext()

  const pathname = usePathname()
  const pathParts = pathname.split('/')
  const basePath = `/${pathParts[1]}/${pathParts[2]}`

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const lastPromptedSubmissionId = useRef<string | undefined>(undefined)

  const status =
    submissionMessages?.submission_complete?.status ??
    submissionMessages?.submission_analyzed?.status ??
    submissionMessages?.attempt_update?.status

  useEffect(() => {
    if (!submissionId) return
    if (status !== 'success') return

    if (lastPromptedSubmissionId.current === submissionId) return
    lastPromptedSubmissionId.current = submissionId
    setIsCommitModalOpen(true)
  }, [status, submissionId])

  useEffect(() => {
    if (!isCommitModalOpen) return
    const suggested = messageData?.problemSlug
      ? `Solve ${messageData.problemSlug}`
      : ''
    setCommitMessage(suggested)
  }, [isCommitModalOpen, messageData?.problemSlug])

  useEffect(() => {
    if (!isCommitModalOpen) return
    if (!data) return
    setIsCommitModalOpen(false)
  }, [data, isCommitModalOpen])
  const aiAnalysis = submissionMessages?.submission_analyzed
  const hasAiAnalysis = !!aiAnalysis?.attemptId

  const linkClasses =
    'flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-foreground rounded-md transition-all duration-300'

  const handleCommitNo = () => {
    setIsCommitModalOpen(false)
  }

  const handleCommitYes = () => {
    const trimmedMessage = commitMessage.trim()
    if (!trimmedMessage) return
    const payload = {
      message: trimmedMessage,
      files: [
        {
          path: `problems/${messageData.problemSlug}/solution.js`,
          content: messageData?.code,
        },
      ],
      branch: 'main',
    }

    postMutation({ payload })
  }

  return (
    <div>
      <nav className="border-primary/30 flex items-center gap-4 border-b bg-transparent p-3">
        <Link href={`${basePath}/description`} className={linkClasses}>
          <NotepadText size={20} />
          <span className="tracking-wide">Description</span>
        </Link>

        <Link href={`${basePath}/submissions`} className={linkClasses}>
          <Clock8 size={20} />
          <span className="tracking-wide">Submissions</span>
        </Link>
        <Link href={`${basePath}/stats`} className={linkClasses}>
          <ChartNoAxesCombined size={20} />
          <span className="tracking-wide">Stats</span>
        </Link>

        {submissionId && status && (
          <SubmissionResultLink
            basePath={basePath}
            status={status}
            submissionId={submissionId}
          />
        )}

        {hasAiAnalysis && (
          <Link
            href={`${basePath}/submissions/${aiAnalysis.attemptId}`}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-4 py-2 text-purple-400 transition-all duration-300 hover:from-purple-500/30 hover:to-blue-500/30"
            title="View AI Analysis"
          >
            <Sparkles size={20} className="animate-pulse" />
            <span className="tracking-wide">AI Analysis</span>
          </Link>
        )}
      </nav>

      {isCommitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="commit-modal-title"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) handleCommitNo()
          }}
        >
          <div className="border-primary/30 bg-background w-full max-w-md rounded-xl border p-5 shadow-xl">
            <h2
              id="commit-modal-title"
              className="text-foreground text-lg font-semibold"
            >
              Success
            </h2>
            <p className="text-foreground/80 mt-2 text-sm">
              Your submission finished successfully. Add a commit message below.
            </p>

            <div className="mt-4">
              <label
                htmlFor="commit-message"
                className="text-foreground/80 text-sm"
              >
                Commit message
              </label>
              <textarea
                id="commit-message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="e.g. Solve two-sum"
                rows={3}
                className="border-primary/30 bg-background text-foreground placeholder:text-foreground/40 focus:border-primary mt-2 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none"
              />
              {!!error && (
                <p className="mt-2 text-sm text-red-400">
                  Commit failed. Please try again.
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCommitNo}
                disabled={loading}
                className="border-primary/30 hover:bg-primary/10 text-foreground rounded-md border px-4 py-2 text-sm transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitYes}
                disabled={loading || !commitMessage.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-2 text-sm transition disabled:opacity-60"
              >
                {loading ? 'Committing…' : 'Commit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
