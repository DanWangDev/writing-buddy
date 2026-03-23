import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, FileText } from 'lucide-react'
import * as api from '../services/api'
import type { Submission } from '@writting-buddy/shared'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  in_coaching: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_coaching: 'In Coaching',
  completed: 'Completed',
}

export function Portfolio() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    api
      .getSubmissions()
      .then((data) => {
        if (!cancelled) setSubmissions(data)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Writing</h1>
        <p className="text-gray-500 mt-1">All your stories and submissions</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">
          {error}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3" />
          <p>No writing yet. Go browse some prompts and start your first story!</p>
          <Link
            to="/prompts"
            className="inline-flex mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Prompts
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {submissions.map((sub) => (
            <Link
              key={sub.id}
              to={
                sub.status === 'completed'
                  ? `/portfolio/${sub.id}`
                  : `/write/${sub.id}`
              }
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Submission #{sub.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sub.wordCount} words &middot;{' '}
                    {new Date(sub.startedAt).toLocaleDateString()} &middot;{' '}
                    {sub.xpEarned} XP
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  STATUS_STYLES[sub.status] ?? STATUS_STYLES.draft
                }`}
              >
                {STATUS_LABELS[sub.status] ?? sub.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
