'use client'
import { Error } from '@/components/error/Error'
import { Filter } from '@/components/problems/Filter'
import { HomeHeader } from '@/components/problems/HomeHeader'
import { Loader } from '@/components/loading/Loader'
import { ProblemLink } from '@/components/problem/ProblemLink'
import { useGetProblems } from '@/hooks/api/use-get-problems'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from '@/components/problems/Search'
import { Sort } from '@/components/problems/Sort'
import { DifficultyType } from '@/consts/filters/difficulty'
import { sortOrderType } from '@/consts/sort/sortOrder'
import { useDebounce } from '@/hooks/debounce/use-debounce'
import { ArrowDownUp, Funnel } from 'lucide-react'

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

  const [sortClicked, setSortClicked] = useState<boolean>(false)
  const [filterClicked, setFilterClicked] = useState<boolean>(false)

  const [fetchedProblems, setFetchedProblems] = useState<ProblemsPageProps[]>(
    []
  )
  const pageRef = useRef<HTMLDivElement | null>(null)
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

  const { data, loading, error } = useGetProblems<ProblemsPageProps[]>({
    params,
  })

  useEffect(() => {
    setPage(1)
  }, [difficulty, topic, sortOrder, debouncedQuery])

  useEffect(() => {
    if (!pageRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((previous) => previous + 1)
        }
      },
      { threshold: 1.0 }
    )
    observer.observe(pageRef.current)

    return () => observer.disconnect()
  }, [pageRef.current, loading])

  useEffect(() => {
    if (!data) return
    setFetchedProblems((previous) =>
      page === 1 && previous ? data : [...previous, ...data]
    )
  }, [data])

  const onFilterReset = useCallback(() => {
    setDifficulty('')
    setTopic('')
  }, [])

  if (error) return <Error {...error} />

  return (
    <div>
      <main className="container mx-auto px-6 py-10">
        <header className="mb-10">
          <HomeHeader />
        </header>
        <nav className="border-primary/40 from-primary/10 via-accent/5 to-primary/10 relative z-10 mx-auto mb-8 flex max-w-4xl items-center justify-center gap-4 rounded-2xl border bg-gradient-to-r p-4 shadow-2xl backdrop-blur-lg">
          <Search onQueryChange={setQuery} />
          <div className="border-accent/40 h-8 w-px border-l"></div>
          <button
            onClick={() => {
              setSortClicked((previous: boolean) => !previous)
              if (filterClicked) setFilterClicked(false)
            }}
            className="text-foreground hover:text-accent flex items-center gap-2 transition-all duration-300"
          >
            <ArrowDownUp size={20} />
            <span className="font-semibold">Sort</span>
          </button>
          {sortClicked && (
            <Sort
              selectedSortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
          )}

          <div className="border-accent/40 h-8 w-px border-l"></div>
          <button
            onClick={() => {
              setFilterClicked((previous: boolean) => !previous)
              if (sortClicked) setSortClicked(false)
            }}
            className="text-foreground hover:text-accent flex items-center gap-2 transition-all duration-300"
          >
            <Funnel size={20} />
            <span className="font-semibold">Filter</span>
          </button>
          {filterClicked && (
            <Filter
              selectedDifficulty={difficulty}
              selectedTopic={topic}
              onDifficultyChange={setDifficulty}
              onTopicChange={setTopic}
              onReset={onFilterReset}
            />
          )}
        </nav>
        <section className="custom-scrollbar border-primary/30 from-background/40 via-primary/5 to-accent/5 relative z-0 mx-auto max-w-5xl space-y-4 rounded-2xl border bg-gradient-to-b p-6 shadow-2xl backdrop-blur-md">
          {data &&
            fetchedProblems.map((problem, index) => (
              <ProblemLink key={`${problem.problemId}-${index}`} {...problem} />
            ))}
          <div ref={pageRef} className="h-px"></div>
          {loading && <Loader />}
        </section>
      </main>
    </div>
  )
}
