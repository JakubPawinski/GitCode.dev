'use client'
import { createContext, ReactNode, useContext } from 'react'
export interface AiTutorContextProps {
  tutorData: {
    messages: {
      role: string
      content: string
      createdAt: string
    }[]
  }
  tutorLoading: boolean
  tutorError: any
  children?: ReactNode
}

export const AiTutorContext = createContext<AiTutorContextProps | null>(null)

export const AiTutorContextProvider = ({
  tutorData,
  tutorLoading,
  tutorError,
  children,
}: AiTutorContextProps) => {
  return (
    <AiTutorContext.Provider value={{ tutorData, tutorLoading, tutorError }}>
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
