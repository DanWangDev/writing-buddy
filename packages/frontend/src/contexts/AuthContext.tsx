import {
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context-value'
import * as api from '../services/api'

export { AuthContext } from './auth-context-value'
export type { AuthContextValue } from './auth-context-value'

function getOidcConfig() {
  const issuer = import.meta.env.VITE_OIDC_ISSUER || 'http://localhost:3009'
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'writing-buddy-client'
  const redirectUri = `${window.location.origin}/auth/callback`
  return { issuer, clientId, redirectUri }
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ReturnType<typeof api.getMe> extends Promise<infer U> ? U | null : never>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccessDenied, setIsAccessDenied] = useState(false)

  useEffect(() => {
    // Detect access_denied from hub entitlement check redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'access_denied') {
      setIsAccessDenied(true)
      // Clean the URL
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

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

  const login = useCallback(() => {
    const { issuer, clientId, redirectUri } = getOidcConfig()
    const codeVerifier = generateCodeVerifier()
    const state = generateCodeVerifier().slice(0, 16)

    sessionStorage.setItem('labf_oidc_code_verifier', codeVerifier)
    sessionStorage.setItem('labf_oidc_state', state)

    generateCodeChallenge(codeVerifier).then((codeChallenge) => {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid profile email hub',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
      })

      window.location.href = `${issuer}/oidc/auth?${params.toString()}`
    })
  }, [])

  const logout = useCallback(() => {
    const { issuer } = getOidcConfig()
    const idToken = localStorage.getItem('labf_oidc_id_token')
    api.clearTokens()
    setUser(null)

    const params = new URLSearchParams()
    if (idToken) {
      params.set('id_token_hint', idToken)
    }
    params.set('post_logout_redirect_uri', window.location.origin)

    window.location.href = `${issuer}/oidc/session/end?${params.toString()}`
  }, [])

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    isAccessDenied,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
