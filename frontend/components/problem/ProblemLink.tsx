import Link from 'next/link'
import { Ref } from 'react'

export interface ProblemLinkProps {
  problemId?: number
  title: string
  problemSlug: string
  difficulty: string
}

export const ProblemLink = ({
  problemId,
  title,
  difficulty,
  problemSlug,
}: ProblemLinkProps) => {
  const getDifficultyStyles = () => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30'
      case 'medium':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-400 border border-orange-500/30'
      case 'hard':
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
      default:
        return 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground/80 border border-primary/30'
    }
  }

  const getDifficultyLabel = () => {
    switch (difficulty.toLowerCase()) {
      case 'medium':
        return 'MED.'
      default:
        return difficulty.toUpperCase()
    }
  }

  return (
    <Link
      prefetch
      href={`/problems/${problemSlug}`}
      className="hover:bg-primary/20 flex items-center justify-between rounded-lg p-3 transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="text-foreground/60 w-8 text-center">{problemId}.</div>
        <div className="text-foreground font-medium">{title}</div>
      </div>
      <div
        className={`w-20 rounded-full px-3 py-1 text-center text-sm font-semibold ${getDifficultyStyles()}`}
      >
        {getDifficultyLabel()}
      </div>
    </Link>
  )
}
