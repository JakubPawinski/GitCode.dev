'use client'
import { Description } from '@/components/problem/Description'
import { useProblemContext } from '@/contexts/problem/ProblemContext'

export default function DescriptionPage() {
  const problemData = useProblemContext()

  if (!problemData) return null

  return <Description {...problemData} />
}
