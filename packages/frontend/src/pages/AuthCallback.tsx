import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setTokens } from '../services/api'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const exchangeStarted = useRef(false)

  useEffect(() => {
    if (exchangeStarted.current) return
    exchangeStarted.current = true

    async function handleCallback() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const errorParam = url.searchParams.get('error')

      if (errorParam) {
        if (errorParam === 'access_denied') {
          // Hub denied entitlement — redirect to home with access_denied flag
          sessionStorage.removeItem('labf_oidc_code_verifier')
          sessionStorage.removeItem('labf_oidc_state')
          window.location.href = '/?error=access_denied'
          return
        }
        const description = url.searchParams.get('error_description') ?? errorParam
        setError(`Authentication error: ${description}`)
        return
      }

      if (!code) {
        setError('No authorization code received')
        return
      }

      const savedState = sessionStorage.getItem('labf_oidc_state')
      if (state !== savedState) {
        setError('State mismatch. Please try logging in again.')
        return
      }

      const codeVerifier = sessionStorage.getItem('labf_oidc_code_verifier')
      if (!codeVerifier) {
        setError('Login flow interrupted. Please try again.')
        return
      }

      try {
        // Exchange code via the backend BFF — the backend adds the client_secret
        const response = await fetch('/api/writing/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            redirect_uri: `${window.location.origin}/auth/callback`,
          }),
        })

        if (!response.ok) {
          const errorBody = await response.text()
          setError(`Token exchange failed: ${errorBody}`)
          return
        }

        const data = await response.json() as {
          access_token: string
          refresh_token?: string
          id_token?: string
        }

        // Clean up PKCE state
        sessionStorage.removeItem('labf_oidc_code_verifier')
        sessionStorage.removeItem('labf_oidc_state')

        // Store tokens — use id_token as Bearer token for the backend
        // (hub issues opaque access tokens; the id_token is a JWT with user claims)
        const bearerToken = data.id_token ?? data.access_token
        setTokens(bearerToken, data.refresh_token ?? null)
        if (data.id_token) {
          localStorage.setItem('labf_oidc_id_token', data.id_token)
        }
        // Keep opaque access token for hub API calls (e.g. refresh)
        localStorage.setItem('labf_oidc_hub_token', data.access_token)

        // Full page reload so AuthProvider re-initializes with the new token.
        window.location.href = '/'
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete authentication')
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6 max-w-md">
          <h1 className="font-display text-xl font-bold text-warm-800 mb-2">Authentication Failed</h1>
          <p className="text-warm-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="bg-sky text-white font-semibold rounded-[10px] px-4 h-10 text-sm hover:bg-sky-dark transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
        <p className="text-warm-500 text-sm">Completing sign in...</p>
      </div>
    </div>
  )
}
