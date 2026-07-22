'use client'
import { createContext, ReactNode, useContext } from 'react'

export interface MessageDataProps {
  code: string
  problemSlug: string
  message: string
}
export interface AiSendMessageProps {
  messageData: Partial<MessageDataProps>
}

export const AiSendMessage = createContext<AiSendMessageProps | null>(null)

export const AiSendMessageProvider = ({
  children,
  messageData,
}: {
  children: ReactNode
  messageData: Partial<MessageDataProps>
}) => {
  return (
    <AiSendMessage.Provider value={{ messageData }}>
      {children}
    </AiSendMessage.Provider>
  )
}
export const useAiSendMessageContext = () => {
  const context = useContext(AiSendMessage)
  if (!context) {
    throw new Error('Provider outside the scope')
  }
  return context
}
