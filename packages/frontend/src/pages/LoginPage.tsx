import { useAuth } from '../hooks/useAuth'
import { InkwellWriting, MarginDoodles } from '../components/inkwell'

export function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4 relative overflow-hidden">
      <MarginDoodles />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <InkwellWriting className="mx-auto mb-2" width={120} height={132} />
          <h1 className="font-display text-3xl font-bold text-warm-800">Welcome to Writing Buddy!</h1>
          <p className="text-warm-500 mt-2 text-base">Sign in with your 11+ Hub account to start writing</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-warm-200 p-6 space-y-5">
          <button
            type="button"
            onClick={login}
            className="w-full bg-sky text-white font-semibold rounded-[10px] px-4 h-12 text-base hover:bg-sky-dark transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky/20"
          >
            Sign in with 11+ Hub
          </button>

          <p className="text-center text-sm text-warm-400">
            You will be redirected to the 11+ Hub to sign in or create an account.
          </p>
        </div>
      </div>
    </div>
  )
}
