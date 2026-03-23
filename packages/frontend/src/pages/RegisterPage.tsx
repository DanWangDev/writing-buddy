import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PenLine, Loader2 } from 'lucide-react'
import type { UserRole } from '@writting-buddy/shared'

const ROLES: { value: UserRole; label: string; emoji: string }[] = [
  { value: 'student', label: 'Student', emoji: '✏️' },
  { value: 'parent', label: 'Parent', emoji: '👋' },
  { value: 'tutor', label: 'Tutor', emoji: '📚' },
]

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (!email.trim() || !displayName.trim() || !password || !confirmPassword) {
      return 'Please fill in all fields.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.'
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.'
    }
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await register(email, displayName, password, role)
      navigate('/')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky rounded-2xl mb-4 shadow-lg shadow-sky/20">
            <PenLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-warm-800">Join Writing Buddy!</h1>
          <p className="text-warm-500 mt-2 text-base">Start your creative writing adventure</p>
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
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-warm-200 bg-warm-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-warm-700 mb-1.5">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-[10px] border border-warm-200 bg-warm-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-warm-700 mb-1.5">
              I am a...
            </label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex-1 px-3 h-12 rounded-[10px] text-sm font-semibold border-2 transition-colors ${
                    role === r.value
                      ? 'bg-sky/10 border-sky text-sky'
                      : 'bg-white border-warm-200 text-warm-600 hover:bg-warm-50'
                  }`}
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
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
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-warm-700 mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-[10px] border border-warm-200 bg-warm-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
              placeholder="Type password again"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky text-white font-semibold rounded-[10px] px-4 h-12 text-base hover:bg-sky-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-sky/20"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-base text-warm-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-sky font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
