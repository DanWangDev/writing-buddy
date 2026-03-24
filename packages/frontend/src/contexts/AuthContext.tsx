import {
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import type { UserRole } from '@writing-buddy/shared'
import { AuthContext } from './auth-context-value'
import * as api from '../services/api'

export { AuthContext } from './auth-context-value'
export type { AuthContextValue } from './auth-context-value'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ReturnType<typeof api.getMe> extends Promise<infer U> ? U | null : never>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getMe()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await api.login(email, password)
    setUser(u)
  }, [])

  const register = useCallback(
    async (
      email: string,
      displayName: string,
      password: string,
      role: UserRole,
    ) => {
      const u = await api.register(email, displayName, password, role)
      setUser(u)
    },
    [],
  )

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
