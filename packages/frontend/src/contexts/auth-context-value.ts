import { createContext } from 'react'
import type { PublicUser, UserRole } from '@writting-buddy/shared'

export interface AuthContextValue {
  user: PublicUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    displayName: string,
    password: string,
    role: UserRole,
  ) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
