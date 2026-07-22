'use client'
import { useAuth } from '@/contexts/auth/AuthContext'
import { UserImage } from '../user/UserImage'
import { useGetUserStats } from '@/hooks/api/use-get-user-stats'
import { Error } from '../error/Error'
import { Loader } from '../loading/Loader'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePostCreateRepository } from '@/hooks/api/use-post-create-repository'
import { useGetRepository } from '@/hooks/api/use-get-repository'

interface UserStatsProps {
  activityHeatmap: any[]

  consistencyScore: number
  difficultyBreakdown: {
    easy: number
    medium: number
    hard: number
    total: number
  }

  languageStats: any[]
  performanceMetrics: {
    avgExecutionTime: number | null
    avgMemoryUsed: number | null
    bestExecutionTime: number | null
    bestMemoryUsed: number | null
    executionTimePercentile: number | null
    [key: string]: any
  }
  problemsAttempted: number
  problemsSolved: number

  streak: {
    currentStreak: number
    longestStreak: number
    lastActivityDate: string | null
    activeToday: boolean
  }

  successRate: number
  topicStats: any[]
  totalSubmissions: number
  weeklyActivity: any[]
}

export const Profile = () => {
  const { data } = useAuth()

  if (!data) return null

  const { user } = data

  const pathname = usePathname()

  const { data: statsData, error, loading } = useGetUserStats<UserStatsProps>()

  const {
    data: repoData,
    loading: repoLoading,
    error: repoError,
  } = useGetRepository()

  console.log(repoData)
  const {
    postMutation,
    data: repositoryData,
    error: repositoryError,
    loading: repositoryLoading,
  } = usePostCreateRepository()

  const repositoryErrorMessage =
    repositoryError?.response?.data?.message ??
    repositoryError?.message ??
    (typeof repositoryError === 'string' ? repositoryError : null)

  const repoErrorMessage =
    repoError?.response?.data?.message ??
    repoError?.message ??
    (typeof repoError === 'string' ? repoError : null)

  if (error) return <Error {...error} />
  if (loading) return <Loader />
  if (!statsData) return null

  const {
    totalSubmissions,
    successRate,
    performanceMetrics: { avgExecutionTime, avgMemoryUsed },
    problemsAttempted,
    problemsSolved,
    activityHeatmap,
    streak,
    difficultyBreakdown,
    languageStats,
    topicStats,
  } = statsData

  const totalProblemsMock = 3000
  const solvedProgress = Math.min(
    100,
    Math.max(0, (problemsSolved / Math.max(1, totalProblemsMock)) * 100)
  )

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getMonthsData = () => {
    const heatmap = activityHeatmap || []
    const map = new Map<string, number>()

    heatmap.forEach((item: any) => {
      if (!item || !item.date) return
      const dateKey = String(item.date).split('T')[0]
      const rawCount =
        item.count ?? item.submissions ?? item.totalSubmissions ?? item.value
      const count =
        typeof rawCount === 'number'
          ? rawCount
          : typeof rawCount === 'string'
            ? Number(rawCount)
            : 0
      if (!Number.isFinite(count) || count <= 0) return
      map.set(dateKey, (map.get(dateKey) || 0) + count)
    })

    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)

    const months: {
      key: string
      label: string
      year: number
      days: { date: string; count: number }[]
    }[] = []

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const year = monthDate.getFullYear()
      const monthIndex = monthDate.getMonth()
      const nextMonth = new Date(year, monthIndex + 1, 1)
      const daysInMonth = Math.round(
        (nextMonth.getTime() - monthDate.getTime()) / 86400000
      )

      const days: { date: string; count: number }[] = []
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day)
        const dateKey = formatDate(date)
        days.push({ date: dateKey, count: map.get(dateKey) || 0 })
      }

      months.push({
        key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        label: monthDate.toLocaleString('en-US', { month: 'short' }),
        year,
        days,
      })
    }

    return months
  }

  const monthsData = getMonthsData()

  const maxSubmissionsInView = monthsData.reduce((acc, month) => {
    for (const day of month.days) {
      if (day.count > acc) acc = day.count
    }
    return acc
  }, 0)

  const getHeatmapColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-700/50'
    if (maxCount <= 0) return 'bg-gray-700/50'
    const ratio = count / maxCount
    if (ratio <= 0.25) return 'bg-emerald-900'
    if (ratio <= 0.5) return 'bg-emerald-700'
    if (ratio <= 0.75) return 'bg-emerald-500'
    return 'bg-emerald-400'
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      <section className="border-primary/20 bg-primary/5 flex flex-col items-center justify-between gap-6 rounded-lg border p-6 shadow-sm md:flex-row md:p-8">
        <div className="flex items-center gap-6">
          <div className="ring-primary/30 ring-offset-background relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-offset-2">
            <UserImage
              className="h-full w-full object-cover"
              src={user.avatarUrl}
              width={96}
              height={96}
            />
          </div>
          <div className="space-y-1">
            <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              {user.username}
            </h1>
            <p className="text-foreground/60 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                Rank #{statsData.consistencyScore || 'N/A'}
              </span>
              <span className="bg-accent/10 text-accent inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                Streak: {streak?.currentStreak || 0} 🔥
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`${pathname}/edit`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          Edit Profile
        </Link>
      </section>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="col-span-1 space-y-8">
          <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Repository</h3>
                <p className="text-foreground/60 mt-1 text-sm">
                  Connect your progress with a GitHub repo.
                </p>
              </div>
            </div>

            {(repoLoading || repositoryLoading) && (
              <div className="mt-4 space-y-2">
                <div className="bg-primary/10 h-2 w-full overflow-hidden rounded-full">
                  <div className="bg-primary h-full w-full animate-pulse" />
                </div>
                <p className="text-foreground/60 text-xs">
                  {repositoryLoading ? 'Creating repository…' : 'Loading…'}
                </p>
              </div>
            )}

            {!!repoErrorMessage && (
              <p className="mt-4 text-sm text-red-400">{repoErrorMessage}</p>
            )}

            {!!repositoryErrorMessage && (
              <p className="mt-4 text-sm text-red-400">
                {repositoryErrorMessage}
              </p>
            )}

            {(() => {
              const resolvedRepo: any = (repoData as any)?.data ?? repoData
              const repoName =
                resolvedRepo?.name ??
                resolvedRepo?.full_name ??
                resolvedRepo?.fullName
              const repoUrl =
                resolvedRepo?.html_url ??
                resolvedRepo?.htmlUrl ??
                resolvedRepo?.url

              const hasRepo = !!(resolvedRepo && (repoName || repoUrl))

              if (!hasRepo) {
                return (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => postMutation({ payload: {} })}
                      disabled={repoLoading || repositoryLoading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
                    >
                      {repositoryLoading ? 'Creating…' : 'Create repository'}
                    </button>
                  </div>
                )
              }

              return (
                <div className="mt-4 space-y-3">
                  <div className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground/60">Name</span>
                      <span className="truncate font-medium">
                        {String(repoName ?? 'Repository')}
                      </span>
                    </div>
                  </div>

                  {repoUrl ? (
                    <Link
                      href={String(repoUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary/90 inline-flex items-center text-sm font-medium"
                    >
                      Open repository
                    </Link>
                  ) : null}
                </div>
              )
            })()}
          </div>

          <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Solved Problems</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-sm">Easy</span>
                <span className="font-medium text-emerald-500">
                  {difficultyBreakdown?.easy || 0}
                </span>
              </div>
              <div className="bg-primary/10 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${
                      ((difficultyBreakdown?.easy || 0) /
                        (difficultyBreakdown?.total || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-sm">Medium</span>
                <span className="font-medium text-amber-500">
                  {difficultyBreakdown?.medium || 0}
                </span>
              </div>
              <div className="bg-primary/10 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${
                      ((difficultyBreakdown?.medium || 0) /
                        (difficultyBreakdown?.total || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-sm">Hard</span>
                <span className="font-medium text-red-500">
                  {difficultyBreakdown?.hard || 0}
                </span>
              </div>
              <div className="bg-primary/10 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{
                    width: `${
                      ((difficultyBreakdown?.hard || 0) /
                        (difficultyBreakdown?.total || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="border-primary/20 mt-4 flex justify-between border-t pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {difficultyBreakdown?.total || 0}
                  </div>
                  <div className="text-foreground/60 text-xs uppercase">
                    Total
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {successRate ? successRate.toFixed(1) : 0}%
                  </div>
                  <div className="text-foreground/60 text-xs uppercase">
                    Success Rate
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Languages</h3>
            <div className="space-y-3">
              {languageStats && languageStats.length > 0 ? (
                languageStats.map((lang: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="bg-primary/10 rounded px-2 py-1 text-sm font-medium">
                      {lang.language}
                    </span>
                    <span className="text-foreground/60 text-sm">
                      {lang.successful === 0
                        ? `${lang.submissions ?? lang.count ?? 0} attempts`
                        : `${lang.count ?? 0} solved`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-foreground/60 text-sm italic">
                  No language data yet
                </div>
              )}
            </div>

            <div className="border-primary/20 mt-6 border-t pt-6">
              <h4 className="mb-3 text-base font-semibold">Topics</h4>
              <div className="space-y-3">
                {topicStats && topicStats.length > 0 ? (
                  topicStats.map((t: any, i: number) => (
                    <div
                      key={`${t.topic ?? 'topic'}-${i}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {t.topic}
                        </div>
                        <div className="text-foreground/60 text-xs">
                          {typeof t.attempted === 'number' ? t.attempted : 0}{' '}
                          attempted ·{' '}
                          {typeof t.solved === 'number' ? t.solved : 0} solved
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {typeof t.successRate === 'number'
                            ? `${t.successRate.toFixed(0)}%`
                            : '0%'}
                        </div>
                        <div className="text-foreground/60 text-xs">
                          {t.avgExecutionTime != null
                            ? `${Number(t.avgExecutionTime).toFixed(0)} ms`
                            : '—'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-foreground/60 text-sm italic">
                    No topic stats yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 md:col-span-2">
          <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Progress</h3>
                <div className="text-foreground/60 mt-1 text-sm">
                  <span className="text-foreground font-medium">
                    {problemsSolved.toLocaleString()}
                  </span>{' '}
                  solved ·{' '}
                  <span className="text-foreground font-medium">
                    {totalProblemsMock.toLocaleString()}
                  </span>{' '}
                  total
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">
                  {solvedProgress.toFixed(1)}%
                </div>
                <div className="text-foreground/60 text-xs">
                  {totalProblemsMock.toLocaleString()} total
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="bg-primary/10 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${solvedProgress}%` }}
                />
              </div>
              <div className="text-foreground/60 mt-2 flex justify-between text-xs">
                <span>{problemsAttempted.toLocaleString()} attempted</span>
                <span>{problemsSolved.toLocaleString()} solved</span>
              </div>
            </div>
          </div>

          <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold">
              Submission Activity
              <span className="text-foreground/60 ml-2 text-sm font-normal">
                {totalSubmissions} total submissions
              </span>
            </h3>

            <div className="flex flex-wrap items-start gap-5">
              {monthsData.map((month) => (
                <div key={month.key} className="flex flex-col items-center">
                  <div className="grid auto-cols-max grid-flow-col [grid-template-rows:repeat(7,minmax(0,1fr))] gap-0.5">
                    {month.days.map((day) => (
                      <div
                        key={day.date}
                        title={`${day.date}: ${day.count} submissions`}
                        className={`h-2.5 w-2.5 rounded-[2px] ${getHeatmapColor(
                          day.count,
                          maxSubmissionsInView
                        )}`}
                      />
                    ))}
                  </div>
                  <div className="text-foreground/60 mt-2 text-xs">
                    {month.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-foreground/60 mt-4 flex items-center justify-end gap-2 text-xs">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-[2px] bg-gray-700/50"></div>
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-900"></div>
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-700"></div>
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500"></div>
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-400"></div>
              <span>More</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 shadow-sm">
              <div className="text-foreground/60 mb-2 text-sm font-medium uppercase">
                Efficiency
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Avg Runtime</span>
                    <span className="font-mono">
                      {avgExecutionTime
                        ? `${avgExecutionTime.toFixed(0)} ms`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Avg Memory</span>
                    <span className="font-mono">
                      {avgMemoryUsed
                        ? `${(avgMemoryUsed / 1024).toFixed(1)} MB`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 shadow-sm">
              <div className="text-foreground/60 mb-2 text-sm font-medium uppercase">
                Consistency
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {streak?.longestStreak || 0}
                  </div>
                  <div className="text-sm">Longest Streak</div>
                </div>
                <div className="text-right">
                  <div className="text-accent text-2xl font-bold">
                    {streak?.currentStreak || 0}
                  </div>
                  <div className="text-sm">Current</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
