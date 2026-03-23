import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WordCounter } from '../components/WordCounter'
import { CoachingFeedback } from '../components/CoachingFeedback'
import { RubricChart } from '../components/RubricChart'
import {
  Save,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import * as api from '../services/api'
import type {
  Submission,
  Prompt,
  CoachingPass,
  RubricScores,
} from '@writting-buddy/shared'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function WritingDesk() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [content, setContent] = useState('')
  const [passes, setPasses] = useState<CoachingPass[]>([])
  const [scores, setScores] = useState<RubricScores | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [coaching, setCoaching] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')

  // Load existing submission
  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const data = await api.getSubmission(id!)
        if (cancelled) return
        setSubmission(data)
        setPrompt(data.prompt ?? null)

        const lastRevision =
          data.revisions.length > 0
            ? data.revisions[data.revisions.length - 1]
            : null
        setContent(lastRevision?.content ?? '')

        // Load coaching passes
        try {
          const session = await api.getCoachingSession(id!)
          if (!cancelled) setPasses(session.passes)
        } catch {
          // No coaching yet
        }

        // Load scores if completed
        if (data.status === 'completed') {
          try {
            const s = await api.getScores(id!)
            if (!cancelled) setScores(s)
          } catch {
            // No scores yet
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load submission.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSave = useCallback(async () => {
    setError('')
    setSaving(true)
    try {
      if (!submission) {
        // Create new
        const data = await api.createSubmission({ content })
        setSubmission(data)
        navigate(`/write/${data.id}`, { replace: true })
      } else {
        // Add revision
        await api.createRevision(submission.id, content)
        const updated = await api.getSubmission(submission.id)
        setSubmission(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }, [submission, content, navigate])

  const handleCoaching = useCallback(async () => {
    if (!submission) return
    setError('')
    setCoaching(true)
    try {
      // Save first
      await api.createRevision(submission.id, content)
      const pass = await api.requestCoaching(submission.id)
      setPasses((prev) => [...prev, pass])
      const updated = await api.getSubmission(submission.id)
      setSubmission(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get coaching.')
    } finally {
      setCoaching(false)
    }
  }, [submission, content])

  const handleComplete = useCallback(async () => {
    if (!submission) return
    setError('')
    setCompleting(true)
    try {
      await api.createRevision(submission.id, content)
      const updated = await api.completeSubmission(submission.id)
      setSubmission(updated)
      try {
        const s = await api.getScores(submission.id)
        setScores(s)
      } catch {
        // Scoring may not be ready yet
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete submission.')
    } finally {
      setCompleting(false)
    }
  }, [submission, content])

  const wordCount = countWords(content)
  const isCompleted = submission?.status === 'completed'
  const currentPass = passes.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {prompt ? prompt.title : 'Free Writing'}
          </h1>
          {prompt && (
            <p className="text-sm text-gray-500 mt-0.5">{prompt.body}</p>
          )}
        </div>
        {currentPass > 0 && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
            Pass {currentPass} of 4
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Writing area */}
        <div className="lg:col-span-2 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isCompleted}
            placeholder="Start writing your story here... Let your imagination run wild!"
            className="w-full h-80 lg:h-[500px] rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            aria-label="Writing area"
          />

          <div className="flex items-center justify-between">
            <WordCounter count={wordCount} target={prompt?.wordCountTarget} />

            {!isCompleted && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>

                <button
                  type="button"
                  onClick={handleCoaching}
                  disabled={coaching || !content.trim() || currentPass >= 4}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {coaching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Get Coaching
                </button>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completing || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {completing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Mark Complete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coaching sidebar */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800">Coaching Feedback</h2>

          {passes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-200 p-4">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No coaching feedback yet.</p>
              <p className="mt-1">Write some words and click &quot;Get Coaching&quot; to begin!</p>
            </div>
          ) : (
            passes.map((pass, idx) => (
              <CoachingFeedback key={pass.id} pass={pass} passNumber={idx + 1} />
            ))
          )}

          {scores && (
            <div className="mt-4">
              <RubricChart scores={scores} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
