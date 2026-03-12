'use client'
import { createContext, PropsWithChildren, useContext } from 'react'
export interface AiTutorContextProps {
  messages: {
    role: string
    content: string
    createdAt: string
  }[]
}

export const AiTutorContext = createContext<AiTutorContextProps | null>(null)

export const AiTutorContextProvider = ({
  messages,
  children,
}: PropsWithChildren<AiTutorContextProps>) => {
  return (
    <AiTutorContext.Provider value={{ messages }}>
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
