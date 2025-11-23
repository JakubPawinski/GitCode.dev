'use client'
import { ProblemLinkProps } from '@/components/problem/ProblemLink'
import { useGetProblems } from '@/hooks/api/use-get-problems'
import { createContext, PropsWithChildren } from 'react'

interface ProblemDataProps {
  data?: ProblemLinkProps[]
  loading: boolean
  error: any
}

export const ProblemsLayoutContext = createContext<ProblemDataProps | null>(
  null
)
export const ProblemsLayoutProvider = ({ children }: PropsWithChildren) => {
  const { data, loading, error } = useGetProblems<ProblemLinkProps[]>()
  return (
    <ProblemsLayoutContext.Provider value={{ data, loading, error }}>
      {children}
    </ProblemsLayoutContext.Provider>
  )
}
