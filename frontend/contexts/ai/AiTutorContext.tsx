'use client'
import { createContext, ReactNode, useContext } from 'react'
export interface AiTutorContextProps {
  tutorData: any
}

export const AiTutorContext = createContext<AiTutorContextProps | null>(null)

export const AiTutorContextProvider = ({
  children,
  tutorData,
}: {
  children: ReactNode
  tutorData: any
}) => {
  return (
    <AiTutorContext.Provider value={tutorData}>
      {children}
    </AiTutorContext.Provider>
  )
}
export const useAiTutorContext = () => {
  const context = useContext(AiTutorContext)
  if (!context) {
    throw new Error('Provider outside the scope')
  }
  return context
}
