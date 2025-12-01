'use client'
import { Error } from '@/components/error/Error'
import { Filter } from '@/components/home/Filter'
import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeNavbar } from '@/components/home/HomeNavbar'
import { Loader } from '@/components/loading/Loader'
import { ProblemLink } from '@/components/problem/ProblemLink'
import { useGetProblems } from '@/hooks/api/use-get-problems'
import { useCallback, useState } from 'react'

interface ProblemsPageProps {
  problemId: number
  title: string
  difficulty: string
  problemSlug: string
  topics: string[]
}

export default function ProblemsPage() {
  const [difficulty, setDifficulty] = useState<string>('')
  const [topic, setTopic] = useState<string>('')
  const [query, setQuery] = useState<string>('')

  const { data, loading, error } = useGetProblems<ProblemsPageProps[]>({
    difficulty,
    topic,
    query,
  })

  if (loading) return <Loader />

  if (error) return <Error {...error} />
  if (!data) return null

  const onReset = useCallback(() => {
    setDifficulty('')
    setTopic('')
  }, [])
  return (
    <div>
      <nav>
        <HomeNavbar />
      </nav>
      <main>
        <header>
          <HomeHeader />
        </header>
        <nav>
          <Filter
            selectedDifficulty={difficulty}
            selectedTopic={topic}
            onDifficultyChange={setDifficulty}
            onTopicChange={setTopic}
            onQueryChange={setQuery}
            onReset={onReset}
          />
        </nav>
        <main>
          {data.map((problem) => (
            <ProblemLink key={problem.problemId} {...problem} />
          ))}
        </main>
      </main>
    </div>
  )
}
