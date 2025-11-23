'use client'
import { ProblemContextProps } from '@/app/problems/[problem]/layout'
import { DescriptionProps } from '@/components/problem/Description'
import { ProblemLinkProps } from '@/components/problem/ProblemLink'
import { createContext, ReactNode } from 'react'

interface ProblemDataProps {
  problemData: ProblemContextProps
  problemLoading: boolean
  problemError: any
}

export const ProblemContext = createContext<
  ProblemDataProps | DescriptionProps | ProblemLinkProps | null
>(null)
export const ProblemContextProvider = ({
  children,
  problem,
}: {
  children: ReactNode
  problem: ProblemDataProps
}) => {
  return (
    <ProblemContext.Provider value={{ ...problem }}>
      {children}
    </ProblemContext.Provider>
  )
}
