'use client'
import { Error } from '@/components/error/Error'
import { Loader } from '@/components/loading/Loader'
import { Topic } from '@/components/problem/Topic'
import { useGetTrending } from '@/hooks/api/use-get-trending'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface TrendingProps {
  trending: {
    id: string
    title: string
    problemSlug: string
    difficulty: string
    topics: string[]
    totalSubmissions: number
    acceptanceRate: number
  }[]
}

const difficultyConfig: {
  [key: string]: { text: string; bg: string }
} = {
  easy: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  medium: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
  hard: { text: 'text-red-400', bg: 'bg-red-500/10' },
}

export const Trending = () => {
  const { data, loading, error } = useGetTrending<TrendingProps>()

  if (loading) return <Loader />
  if (error) return <Error {...error} />
  if (!data) return null

  const { trending } = data

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8 flex items-center gap-4">
        <TrendingUp className="text-accent h-8 w-8" />
        <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
          Trending Problems
        </h1>
      </header>

      {trending.length === 0 ? (
        <div className="bg-primary/5 flex h-64 items-center justify-center rounded-lg">
          <p className="text-foreground/60 text-lg">
            No trending problems available at the moment.
          </p>
        </div>
      ) : (
        <main className="space-y-3">
          {trending.map((problem, index) => {
            const difficulty = problem.difficulty.toLowerCase()
            const config = difficultyConfig[difficulty] || difficultyConfig.easy

            const acceptanceRateRaw = Number(problem.acceptanceRate)
            const acceptanceRatePercent = Number.isFinite(acceptanceRateRaw)
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    acceptanceRateRaw <= 1
                      ? acceptanceRateRaw * 100
                      : acceptanceRateRaw
                  )
                )
              : null

            return (
              <Link
                href={`/problems/${problem.problemSlug}`}
                key={problem.id}
                className="group block"
              >
                <div className="bg-primary/5 group-hover:border-primary/20 group-hover:bg-primary/10 flex items-center justify-between rounded-lg border border-transparent p-4 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center gap-6">
                    <span className="text-foreground/40 w-8 text-center text-xl font-bold">
                      {index + 1}
                    </span>
                    <h2 className="text-lg font-semibold">{problem.title}</h2>
                  </div>

                  <div className="flex flex-1 items-center justify-end gap-6">
                    <div className="hidden items-center gap-2 lg:flex">
                      {problem.topics.slice(0, 2).map((topic, index) => (
                        <Topic key={`${topic}-${index}`} topic={topic} />
                      ))}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-foreground/60 flex w-20 items-center justify-center gap-2">
                        <span className="font-medium">
                          {acceptanceRatePercent === null
                            ? '—'
                            : `${acceptanceRatePercent.toFixed(1)}%`}
                        </span>
                      </div>
                      <div
                        className={`flex w-24 items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${config.bg} ${config.text}`}
                      >
                        {problem.difficulty}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </main>
      )}
    </div>
  )
}
