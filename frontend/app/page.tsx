'use client'
import { Error } from '@/components/error/Error'
import { Filter } from '@/components/home/Filter'
import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeNavbar } from '@/components/home/HomeNavbar'
import { Loader } from '@/components/loading/Loader'
import { ProblemLink } from '@/components/problem/ProblemLink'
import { useGetProblems } from '@/hooks/api/use-get-problems'
import { useCallback, useState } from 'react'
import { Search } from '@/components/home/Search'
import { Sort } from '@/components/home/Sort'
import { DifficultyType } from '@/consts/filters/difficulty'
import { sortOrderType } from '@/consts/sort/sortOrder'
import { useDebounce } from '@/hooks/debounce/use-debounce'

export interface ProblemsPageProps {
  problemId: number
  title: string
  difficulty: string
  problemSlug: string
  topics: string[]
  token: string
}

export default function Home() {
  const [difficulty, setDifficulty] = useState<DifficultyType | ''>('')
  const [topic, setTopic] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<sortOrderType | ''>('')
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const LIMIT = 100

  const { debouncedQuery } = useDebounce({ query })

  const params = {
    difficulty: difficulty,
    topic: topic,
    sortOrder: sortOrder,
    query: debouncedQuery,
    page: page,
    limit: LIMIT,
  }
  const onFilterReset = useCallback(() => {
    setDifficulty('')
    setTopic('')
  }, [])

  const { data, loading, error } = useGetProblems<ProblemsPageProps[]>({
    params,
  })

  if (error) return <Error {...error} />

  return (
    <div>
      <nav className="border-primary/10 from-background/95 via-primary/5 to-accent/5 sticky top-0 z-50 border-b shadow-2xl backdrop-blur-xl">
        <HomeNavbar />
      </nav>
      <main className="container mx-auto px-6 py-10">
        <header className="mb-10">
          <HomeHeader />
        </header>
        <nav className="border-primary/40 from-primary/10 via-accent/5 to-primary/10 relative z-10 mx-auto mb-8 flex max-w-4xl items-center justify-center gap-4 rounded-2xl border bg-gradient-to-r p-4 shadow-2xl backdrop-blur-lg">
          <Search onQueryChange={setQuery} />
          <div className="border-accent/40 h-8 w-px border-l"></div>
          <Sort
            selectedSortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
          <div className="border-accent/40 h-8 w-px border-l"></div>
          <Filter
            selectedDifficulty={difficulty}
            selectedTopic={topic}
            onDifficultyChange={setDifficulty}
            onTopicChange={setTopic}
            onReset={onFilterReset}
          />
        </nav>
        <section className="custom-scrollbar border-primary/30 from-background/40 via-primary/5 to-accent/5 relative z-0 mx-auto max-w-5xl space-y-4 rounded-2xl border bg-gradient-to-b p-6 shadow-2xl backdrop-blur-md">
          {loading ? (
            <Loader />
          ) : data ? (
            data.map((problem) => (
              <ProblemLink key={problem.problemId} {...problem} />
            ))
          ) : null}
        </section>
      </main>
    </div>
  )
}
