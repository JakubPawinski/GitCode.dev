'use client'
import { useGetProblemStats } from '@/hooks/api/use-get-problem-stats'
import { useParams } from 'next/navigation'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'

interface ProblemStatsData {
  totalSubmissions: number
  acceptedSubmissions: number
  acceptanceRate: number
  avgExecutionTime: number
  avgMemoryUsed: number | null
  updatedAt: string
}

export const ProblemStats = () => {
  const { problem } = useParams()

  const { data, loading, error } = useGetProblemStats<ProblemStatsData>({
    problem: problem as string,
  })
  if (loading) return <Loader />
  if (error) return <Error {...error} />

  const stats = [
    {
      label: 'Acceptance Rate',
      value: `${(data?.acceptanceRate ?? 0).toFixed(2)}%`,
    },
    {
      label: 'Total Submissions',
      value: (data?.totalSubmissions ?? 0).toLocaleString(),
    },
    {
      label: 'Accepted Submissions',
      value: (data?.acceptedSubmissions ?? 0).toLocaleString(),
    },
    {
      label: 'Avg. Execution Time',
      value: `${(data?.avgExecutionTime ?? 0).toFixed(0)} ms`,
    },
    {
      label: 'Avg. Memory Used',
      value: data?.avgMemoryUsed
        ? `${(data.avgMemoryUsed / 1024).toFixed(2)} KB`
        : '0.00 KB',
    },
  ]

  return (
    <div className="border-primary/20 rounded-xl border bg-transparent p-6 shadow-2xl backdrop-blur-sm">
      <header className="border-primary/30 mb-6 border-b pb-4">
        <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
          Statistics
        </h1>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-primary/5 border-primary/20 hover:border-primary/40 group rounded-lg border p-4 transition-all duration-300"
          >
            <p className="text-foreground/60 mb-1 text-sm font-medium">
              {stat.label}
            </p>
            <p className="text-foreground text-2xl font-bold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="text-foreground/60 mt-6 text-right text-xs">
        Last updated: {data ? new Date(data.updatedAt).toLocaleString() : 'N/A'}
      </div>
    </div>
  )
}
