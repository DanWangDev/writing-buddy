import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { InkwellWriting, InkwellSleeping, MarginDoodles } from '../components/inkwell'
import { PenLine, Trophy, Clock, ArrowRight, Loader2 } from 'lucide-react'
import * as api from '../services/api'
import type { Submission, WritingProgress } from '@writing-buddy/shared'

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
    <div className="space-y-6 relative">
      <MarginDoodles variant="default" />

      {/* Welcome — speech bubble style */}
      <div className="card-clay-static p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative z-10">
            <div className="speech-bubble inline-block px-6 py-4 mb-2">
              <h1 className="font-display text-3xl text-warm-800 tracking-wider uppercase">
                LET'S GO, {user?.displayName ?? 'Writer'}!
              </h1>
              <p className="text-warm-600 mt-1 text-base font-bold">Your story awaits. Ready to write something EPIC?</p>
            </div>
          </div>
          <Link
            to="/write"
            className="btn-manga inline-flex items-center gap-2 bg-sky text-white text-lg px-6 h-12 shrink-0 relative z-10"
          >
            <PenLine className="w-5 h-5" />
            START WRITING!
          </Link>
        </div>
        <InkwellWriting className="absolute -right-2 -bottom-4 opacity-[0.18] hidden sm:block" width={140} height={154} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500" role="alert">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-clay-static p-5 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-coral border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_var(--color-ink)] mx-auto mb-2">
            <span className="text-2xl">&#x1F525;</span>
          </div>
          <p className="text-xs font-bold text-warm-400 uppercase tracking-wider">Streak</p>
          <p className="font-display text-3xl text-coral tracking-wide">{streak}</p>
        </div>

        <div className="card-clay-static p-5 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-gold border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_var(--color-ink)] mx-auto mb-2">
            <Trophy className="w-6 h-6 text-ink" />
          </div>
          <p className="text-xs font-bold text-warm-400 uppercase tracking-wider">XP Today</p>
          <p className="font-display text-3xl text-gold-dark tracking-wide">{todayXp}</p>
        </div>

        <div className="card-clay-static p-5 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-sky border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_var(--color-ink)] mx-auto mb-2">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-bold text-warm-400 uppercase tracking-wider">Words This Week</p>
          <p className="font-display text-3xl text-sky tracking-wide">{totalWords}</p>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="card-clay-static p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-warm-800 tracking-wider uppercase">Recent Writing</h2>
          <Link
            to="/portfolio"
            className="text-sm text-sky font-bold hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <InkwellSleeping className="mx-auto mb-2 opacity-60" width={140} height={126} />
            <p className="text-warm-400 text-base">Inkwell is waiting for your first story!</p>
            <Link
              to="/prompts"
              className="btn-manga inline-flex items-center gap-2 mt-4 bg-sky text-white text-base px-5 h-12"
            >
              Browse Prompts
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-warm-200">
            {recentSubmissions.map((sub) => (
              <Link
                key={sub.id}
                to={sub.status === 'completed' ? `/portfolio/${sub.id}` : `/write/${sub.id}`}
                className="flex items-center justify-between py-3 hover:bg-warm-50 -mx-2 px-2 rounded-[10px] transition-colors"
              >
                <div>
                  <p className="text-base font-bold text-warm-700">
                    {sub.promptTitle ?? `Free Writing #${sub.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-warm-400">
                    {sub.wordCount} words &middot;{' '}
                    {new Date(sub.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                    {new Date(sub.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
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
    draft: 'bg-warm-100 text-warm-600 border-ink',
    in_coaching: 'bg-sky/10 text-sky border-ink',
    completed: 'bg-green-500 text-white border-ink',
  }

  const labels: Record<string, string> = {
    draft: 'Draft',
    in_coaching: 'In Coaching',
    completed: 'Completed',
  }

  return (
    <span className={`badge-manga text-xs ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  )
}
