import { useContext } from 'react'
import { AuthContext } from '../contexts/auth-context-value'
import type { AuthContextValue } from '../contexts/auth-context-value'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
