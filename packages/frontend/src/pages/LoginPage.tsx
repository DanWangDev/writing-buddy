import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PenLine, Loader2 } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky rounded-2xl mb-4 shadow-lg shadow-sky/20">
            <PenLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-warm-800">Welcome back!</h1>
          <p className="text-warm-500 mt-2 text-base">Sign in to continue your writing journey</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6 space-y-5"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-warm-700 mb-1.5">
              Email or Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-warm-200 bg-warm-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
              placeholder="you@example.com or username"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-warm-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-warm-200 bg-warm-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky text-white font-semibold rounded-[10px] px-4 h-12 text-base hover:bg-sky-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-sky/20"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-center text-base text-warm-500 mt-5">
          New here?{' '}
          <Link to="/register" className="text-sky font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
