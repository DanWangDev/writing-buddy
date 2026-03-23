import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { StreakBadge } from '../components/StreakBadge'
import { PenLine, Trophy, Clock, ArrowRight, Loader2 } from 'lucide-react'
import * as api from '../services/api'
import type { Submission, WritingProgress } from '@writting-buddy/shared'

export function Dashboard() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [progress, setProgress] = useState<WritingProgress[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [streakData, progressData, subsData] = await Promise.all([
          api.getStreak(),
          api.getProgress(7),
          api.getSubmissions(),
        ])
        if (cancelled) return
        setStreak(streakData.streakDays)
        setProgress(progressData)
        setSubmissions(subsData)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load dashboard data.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const todayXp = progress.length > 0 ? progress[progress.length - 1]?.xpEarned ?? 0 : 0
  const totalWords = progress.reduce((sum, p) => sum + p.wordsWritten, 0)
  const recentSubmissions = submissions.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-2xl border border-warm-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-warm-800">
              Welcome back, {user?.displayName ?? 'Writer'}!
            </h1>
            <p className="text-warm-500 mt-1 text-base">Ready to write something amazing today?</p>
          </div>
          <Link
            to="/write"
            className="inline-flex items-center gap-2 bg-sky text-white font-semibold rounded-[10px] px-5 h-12 text-base hover:bg-sky-dark transition-colors shrink-0 shadow-sm shadow-sky/20"
          >
            <PenLine className="w-5 h-5" />
            Start Writing
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500" role="alert">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[16px] border border-warm-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-coral/10 flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-500">Writing Streak</p>
            <StreakBadge streak={streak} />
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-warm-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-gold/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-gold-dark" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-500">XP Today</p>
            <p className="font-display text-2xl font-bold text-warm-800">{todayXp}</p>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-warm-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-violet/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-violet-dark" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-500">Words This Week</p>
            <p className="font-display text-2xl font-bold text-warm-800">{totalWords}</p>
          </div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-white rounded-2xl border border-warm-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-warm-800">Recent Writing</h2>
          <Link
            to="/portfolio"
            className="text-sm text-sky font-semibold hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-warm-400 text-base">No stories yet — time to start your first adventure!</p>
            <Link
              to="/prompts"
              className="inline-flex items-center gap-2 mt-4 bg-sky text-white font-semibold rounded-[10px] px-5 h-12 text-base hover:bg-sky-dark transition-colors"
            >
              Browse Prompts
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {recentSubmissions.map((sub) => (
              <Link
                key={sub.id}
                to={sub.status === 'completed' ? `/portfolio/${sub.id}` : `/write/${sub.id}`}
                className="flex items-center justify-between py-3 hover:bg-warm-50 -mx-2 px-2 rounded-[10px] transition-colors"
              >
                <div>
                  <p className="text-base font-semibold text-warm-700">
                    Submission #{sub.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-warm-400">
                    {sub.wordCount} words &middot; {new Date(sub.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={sub.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-warm-100 text-warm-600',
    in_coaching: 'bg-sky/10 text-sky',
    completed: 'bg-green-100 text-green-700',
  }

  const labels: Record<string, string> = {
    draft: 'Draft',
    in_coaching: 'In Coaching',
    completed: 'Completed',
  }

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  )
}
