import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.displayName ?? 'Writer'}!
            </h1>
            <p className="text-gray-500 mt-1">Ready to write something amazing today?</p>
          </div>
          <Link
            to="/write"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-indigo-700 transition-colors shrink-0"
          >
            <PenLine className="w-4 h-4" />
            Start Writing
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <span className="text-lg">🔥</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Writing Streak</p>
            <StreakBadge streak={streak} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">XP Today</p>
            <p className="text-xl font-bold text-gray-900">{todayXp}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Words This Week</p>
            <p className="text-xl font-bold text-gray-900">{totalWords}</p>
          </div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Writing</h2>
          <Link
            to="/portfolio"
            className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            No submissions yet. Start your first story!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentSubmissions.map((sub) => (
              <Link
                key={sub.id}
                to={sub.status === 'completed' ? `/portfolio/${sub.id}` : `/write/${sub.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Submission #{sub.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400">
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
    draft: 'bg-gray-100 text-gray-600',
    in_coaching: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  }

  const labels: Record<string, string> = {
    draft: 'Draft',
    in_coaching: 'In Coaching',
    completed: 'Completed',
  }

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  )
}
