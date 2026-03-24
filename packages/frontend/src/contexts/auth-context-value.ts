import { createContext } from 'react'
import type { PublicUser } from '@writing-buddy/shared'

export interface AuthContextValue {
  user: PublicUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
