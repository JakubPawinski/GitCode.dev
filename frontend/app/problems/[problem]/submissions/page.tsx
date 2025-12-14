'use client'
import { ProblemLinkProps } from '@/components/problem/ProblemLink'
import { ProblemSubmissions } from '@/components/submission/ProblemSubmissions'
import { ProblemContext } from '@/contexts/ProblemContext'
import { useContext } from 'react'

export default function SubmissionsPage() {
  const problemData = useContext(ProblemContext) as ProblemLinkProps
  const { problemSlug } = problemData
  return <ProblemSubmissions problem={problemSlug} />
}
