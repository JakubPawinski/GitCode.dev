import { createContext } from 'react'

interface AuthContextProps {
  refreshToken: string
  accessToken: string
}

export const AuthContext = createContext<AuthContextProps | null>(null)
