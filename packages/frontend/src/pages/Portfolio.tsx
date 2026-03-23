import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, FileText, Trash2 } from 'lucide-react'
import * as api from '../services/api'
import type { Submission } from '@writting-buddy/shared'

interface SubmissionWithTitle extends Submission {
  promptTitle?: string | null
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-warm-100 text-warm-600',
  in_coaching: 'bg-sky/10 text-sky',
  completed: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_coaching: 'In Coaching',
  completed: 'Completed',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function Portfolio() {
  const [submissions, setSubmissions] = useState<SubmissionWithTitle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    api
      .getSubmissions()
      .then((data) => {
        if (!cancelled) setSubmissions(data as SubmissionWithTitle[])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load submissions.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return

    setDeleting(id)
    setError('')
    try {
      await api.deleteSubmission(id)
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
    } finally {
      setDeleting(null)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-800">My Writing</h1>
        <p className="text-warm-500 mt-1 text-base">All your stories and submissions</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500" role="alert">
          {error}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 mx-auto mb-3 text-warm-300" />
          <p className="text-warm-400 text-base">No writing yet. Go browse some prompts and start your first story!</p>
          <Link
            to="/prompts"
            className="inline-flex mt-4 px-5 h-12 items-center bg-sky text-white text-base font-semibold rounded-[10px] hover:bg-sky-dark transition-colors shadow-sm shadow-sky/20"
          >
            Browse Prompts
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-200 divide-y divide-warm-100">
          {submissions.map((sub) => {
            const displayTitle = sub.promptTitle ?? `Submission #${sub.id.slice(0, 8)}`

            return (
              <div key={sub.id} className="flex items-center justify-between p-4 hover:bg-warm-50 transition-colors group">
                <Link
                  to={
                    sub.status === 'completed'
                      ? `/portfolio/${sub.id}`
                      : `/write/${sub.id}`
                  }
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="w-12 h-12 rounded-[10px] bg-sky/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-sky" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-warm-700 truncate">
                      {displayTitle}
                    </p>
                    <p className="text-sm text-warm-400">
                      {sub.wordCount} words &middot;{' '}
                      {formatDateTime(sub.startedAt)} &middot;{' '}
                      {sub.xpEarned} XP
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      STATUS_STYLES[sub.status] ?? STATUS_STYLES.draft
                    }`}
                  >
                    {STATUS_LABELS[sub.status] ?? sub.status}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, sub.id, displayTitle)}
                    disabled={deleting === sub.id}
                    className="p-2 rounded-lg text-warm-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    aria-label={`Delete ${displayTitle}`}
                  >
                    {deleting === sub.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
