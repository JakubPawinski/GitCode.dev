'use client'
import { ProblemDataProps } from '@/app/problems/[problem]/layout'
import { createContext, ReactNode, useContext } from 'react'
export interface ProblemContextProps {
  problemData: ProblemDataProps | null
  setProblemData: (problemData: ProblemDataProps | null) => void
}

export const ProblemContext = createContext<ProblemDataProps | null>(null)

export const ProblemProvider = ({
  children,
  problemData,
}: {
  children: ReactNode
  problemData: ProblemDataProps | null
}) => {
  return (
    <ProblemContext.Provider value={problemData}>
      {children}
    </ProblemContext.Provider>
  )
}
export const useProblemContext = () => {
  const context = useContext(ProblemContext)
  if (!context) {
    throw new Error('Provider outside the scope')
  }
  return context
}
