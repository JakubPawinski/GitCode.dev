'use client'
import { createContext, ReactNode, useContext } from 'react'
export interface AiTutorContextProps {
  tutorData: {
    sessionId?: number | string
    createdAt?: string
    messages: {
      role: string
      content: string
      createdAt?: string
    }[]
  }
  messageLoading: boolean
  messageError: any
}

export const AiTutorContext = createContext<AiTutorContextProps | null>(null)

export const AiTutorContextProvider = ({
  children,
  tutorData,
  messageLoading,
  messageError,
}: {
  children: ReactNode
  tutorData: {
    sessionId?: number | string
    createdAt?: string
    messages: {
      role: string
      content: string
      createdAt?: string
    }[]
  }
  messageLoading: boolean
  messageError: any
}) => {
  return (
    <AiTutorContext.Provider
      value={{ tutorData, messageLoading, messageError }}
    >
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
