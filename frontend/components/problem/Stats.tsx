'use client'
import { useGetProblemStats } from '@/hooks/api/use-get-problem-stats'
import { useParams } from 'next/navigation'
import { Loader } from '../loading/Loader'
import { Error } from '../error/Error'

interface ProblemStatsProps {}

export const ProblemStats = () => {
  const { problem } = useParams()

  const { data, loading, error } = useGetProblemStats<ProblemStatsProps>({
    problem: problem as string,
  })
  if (loading) return <Loader />
  if (error) return <Error {...error} />
  if (!data) return null
  console.log(data)
  return null
}
