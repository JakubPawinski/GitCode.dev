'use client'
import { useAuth } from '@/contexts/auth/AuthContext'
import { UserImage } from '../user/UserImage'
import {
  useGetUserStats,
  UserStatsProps,
} from '@/hooks/api/profile/use-get-user-stats'
import { Error } from '../error/Error'
import { Loader } from '../loading/Loader'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePostCreateRepository } from '@/hooks/github/use-post-create-repository'
import {
  RepositoryDataProps,
  useGetRepository,
} from '@/hooks/github/use-get-repository'
import { getHeatmapColor } from '@/utils/heatmapColor'
import { monthFormat } from '@/utils/monthFormat'

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
  } = useGetRepository<RepositoryDataProps>()

  const {
    postMutation,
    data: repositoryData,
    error: repositoryError,
    loading: repositoryLoading,
  } = usePostCreateRepository()

  if (error) return <Error {...error} />
  if (repoError) return <Error {...repoError} />
  if (loading || repoLoading) return <Loader />
  if (!statsData || !repoData) return null

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

  const { months: monthsData, maxSubmissionsInView } = monthFormat({
    activityHeatmap,
  })

  const { name, htmlUrl } = repoData

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
            <div className="mt-5">
              {!repoData && (
                <button
                  type="button"
                  onClick={() => postMutation({ payload: {} })}
                  disabled={repoLoading || repositoryLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {repositoryLoading ? 'Creating…' : 'Create repository'}
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <div className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground/60">Name</span>
                  <span className="truncate font-medium">
                    {name ?? 'Repository'}
                  </span>
                </div>
              </div>

              {htmlUrl && (
                <Link
                  href={htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:text-primary/90 inline-flex items-center text-sm font-medium"
                >
                  Open repository
                </Link>
              )}
            </div>
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
              {monthsData.map((month, index) => (
                <div
                  key={month.key + index}
                  className="flex flex-col items-center"
                >
                  <div className="grid auto-cols-max grid-flow-col [grid-template-rows:repeat(7,minmax(0,1fr))] gap-0.5">
                    {month.days.map((day) => (
                      <div
                        key={day.date}
                        title={`${day.date}: ${day.count} submissions`}
                        className={`h-2.5 w-2.5 rounded-[2px] ${getHeatmapColor(
                          {
                            count: day.count,
                            maxCount: maxSubmissionsInView,
                          }
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
