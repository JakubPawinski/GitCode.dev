'use client'
import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { AuthContextProps } from '@/app/auth/callback/page'

export interface AuthContextType {
  data: AuthContextProps | null
  setData: (data: AuthContextProps | null) => void
}
export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<AuthContextProps | null>(null)
  return (
    <AuthContext.Provider value={{ data, setData }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('Provider outside the scope')
  }
  return context
}
