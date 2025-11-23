import Link from 'next/link'

export interface ProblemLinkProps {
  problemId: number
  problemSlug: string
  title: string
  difficulty: string
}

export const ProblemLink = ({
  title,
  problemId,
  difficulty,
  problemSlug,
}: ProblemLinkProps) => {
  return (
    <Link
      className="hover:bg-primary/20 flex items-center justify-between rounded-lg p-3 transition-colors"
      href={problemSlug}
    >
      <div className="flex items-center gap-4">
        <div className="text-foreground/60 w-8 text-center">{problemId}.</div>
        <div className="text-foreground font-medium">{title}</div>
      </div>
      <div className="text-foreground/80 font-semibold">{difficulty}</div>
    </Link>
  )
}
