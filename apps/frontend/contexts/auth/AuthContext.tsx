'use client'
import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { AuthContextProps } from '@/app/auth/callback/page'

export interface AuthContextType {
  data: AuthContextProps | null
  setData: (data: AuthContextProps | null) => void
  /**
   * One-shot flag set right before an explicit logout clears `data`. Lets
   * Interceptor tell "user just signed out" apart from "session expired
   * while browsing" — both present as `data` going to `null`, but only the
   * latter should trigger a silent-refresh retry / Keycloak redirect.
   */
  isLoggingOut: boolean
  setIsLoggingOut: (value: boolean) => void
}
export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<AuthContextProps | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  return (
    <AuthContext.Provider
      value={{ data, setData, isLoggingOut, setIsLoggingOut }}
    >
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
