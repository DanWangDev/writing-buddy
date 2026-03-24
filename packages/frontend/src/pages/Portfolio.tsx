import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, FileText, Trash2 } from 'lucide-react'
import { InkwellSleeping, MarginDoodles } from '../components/inkwell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../services/api'
import type { Submission } from '@writting-buddy/shared'

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

export function Portfolio() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null)

  const openDeleteDialog = useCallback((e: React.MouseEvent, sub: Submission) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteTarget(sub)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return

    const sub = deleteTarget
    setDeleteTarget(null)
    setDeleting(sub.id)
    try {
      await api.deleteSubmission(sub.id)
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete submission.')
    } finally {
      setDeleting(null)
    }
  }, [deleteTarget])

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
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      <MarginDoodles variant="portal" />
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
          <InkwellSleeping className="mx-auto mb-2 opacity-60" width={160} height={144} />
          <p className="text-warm-400 text-base">Inkwell is snoozing... Wake them up with your first story!</p>
          <Link
            to="/prompts"
            className="inline-flex mt-4 px-5 h-12 items-center bg-sky text-white text-base font-semibold rounded-[10px] hover:bg-sky-dark transition-colors shadow-sm shadow-sky/20"
          >
            Browse Prompts
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-200 divide-y divide-warm-100">
          {submissions.map((sub) => (
            <Link
              key={sub.id}
              to={
                sub.status === 'completed'
                  ? `/portfolio/${sub.id}`
                  : `/write/${sub.id}`
              }
              className="flex items-center justify-between p-4 hover:bg-warm-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-sky/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-sky" />
                </div>
                <div>
                  <p className="text-base font-semibold text-warm-700">
                    {sub.promptTitle ?? `Free Writing #${sub.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-warm-400">
                    {sub.wordCount} words &middot;{' '}
                    {new Date(sub.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                    {new Date(sub.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} &middot;{' '}
                    {sub.xpEarned} XP
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_STYLES[sub.status] ?? STATUS_STYLES.draft
                  }`}
                >
                  {STATUS_LABELS[sub.status] ?? sub.status}
                </span>
                {sub.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={(e) => openDeleteDialog(e, sub)}
                    disabled={deleting === sub.id}
                    className="p-1.5 rounded-lg text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label="Delete draft"
                  >
                    {deleting === sub.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this draft?"
        message="This will remove the story and all its coaching feedback. You won't be able to get it back."
        confirmLabel="Yes, delete it"
        cancelLabel="No, keep it!"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
