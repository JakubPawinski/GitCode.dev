'use client'
import { createContext, PropsWithChildren, useContext } from 'react'
export interface AiAnalysisContextProps {
  attemptId?: string
}

export const AiAnalysisContext = createContext<AiAnalysisContextProps | null>(
  null
)

export const AiAnalysisContextProvider = ({
  attemptId,
  children,
}: PropsWithChildren<AiAnalysisContextProps>) => {
  return (
    <AiAnalysisContext.Provider value={{ attemptId }}>
      {children}
    </AiAnalysisContext.Provider>
  )
}
export const useAiAnalysisContext = () => {
  const context = useContext(AiAnalysisContext)
  if (!context) {
    throw new Error('Provider outside the scope')
  }
  return context
}
