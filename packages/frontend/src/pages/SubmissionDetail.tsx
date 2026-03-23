import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CoachingFeedback } from '../components/CoachingFeedback'
import { RubricChart } from '../components/RubricChart'
import { WordCounter } from '../components/WordCounter'
import { InlineDiff } from '../components/InlineDiff'
import { ArrowLeft, Loader2, FileText, PenLine, GitCompareArrows } from 'lucide-react'
import * as api from '../services/api'
import type {
  Submission,
  Revision,
  Prompt,
  CoachingPass,
  RubricScores,
} from '@writting-buddy/shared'

export function SubmissionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [passes, setPasses] = useState<CoachingPass[]>([])
  const [scores, setScores] = useState<RubricScores | null>(null)
  const [selectedRevision, setSelectedRevision] = useState(0)
  const [showChanges, setShowChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const data = await api.getSubmission(id!)
        if (cancelled) return
        setSubmission(data)
        setRevisions(data.revisions)
        setPrompt(data.prompt ?? null)
        setSelectedRevision(data.revisions.length - 1)

        try {
          const session = await api.getCoachingSession(id!)
          if (!cancelled) setPasses(session.passes)
        } catch {
          // No coaching
        }

        if (data.status === 'completed') {
          try {
            const s = await api.getScores(id!)
            if (!cancelled) setScores(s)
          } catch {
            // No scores
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-20 text-warm-400">
        <p>Submission not found.</p>
      </div>
    )
  }

  const currentRevision = revisions[selectedRevision]
  const previousRevision = selectedRevision > 0 ? revisions[selectedRevision - 1] : null
  const canShowChanges = selectedRevision > 0 && previousRevision != null
  const canResume = submission.status !== 'completed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/portfolio')}
          className="p-2 text-warm-400 hover:text-warm-600 transition-colors rounded-lg hover:bg-warm-100"
          aria-label="Back to portfolio"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-warm-800">
            {prompt ? prompt.title : `Submission #${submission.id.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-warm-500">
            {new Date(submission.startedAt).toLocaleDateString()} &middot;{' '}
            {submission.xpEarned} XP earned
          </p>
        </div>
        {canResume && (
          <Link
            to={`/write/${submission.id}`}
            className="inline-flex items-center gap-1.5 px-4 h-10 text-sm font-semibold rounded-[10px] bg-sky text-white hover:bg-sky-dark transition-colors shadow-sm shadow-sky/20"
          >
            <PenLine className="w-4 h-4" />
            Resume Writing
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Revision tabs + Changes toggle */}
          {revisions.length > 1 && (
            <div className="flex items-center gap-3">
              <div className="flex gap-1 overflow-x-auto pb-1 flex-1">
                {revisions.map((rev, idx) => (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => {
                      setSelectedRevision(idx)
                      if (idx === 0) setShowChanges(false)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedRevision === idx
                        ? 'bg-sky text-white'
                        : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
                    }`}
                  >
                    Revision {rev.revisionNumber}
                  </button>
                ))}
              </div>

              {canShowChanges && (
                <button
                  type="button"
                  onClick={() => setShowChanges(!showChanges)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    showChanges
                      ? 'bg-violet/10 text-violet-dark border border-violet-light'
                      : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
                  }`}
                >
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  {showChanges ? 'Show Clean' : 'Show Changes'}
                </button>
              )}
            </div>
          )}

          {/* Content display */}
          <div className="writing-paper rounded-[16px] border border-warm-200 p-6">
            {currentRevision ? (
              <>
                {showChanges && previousRevision ? (
                  <InlineDiff
                    oldText={previousRevision.content}
                    newText={currentRevision.content}
                  />
                ) : (
                  <div className="font-body text-xl max-w-none text-warm-700 whitespace-pre-wrap leading-relaxed">
                    {currentRevision.content}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-warm-200">
                  <WordCounter count={currentRevision.wordCount} target={prompt?.wordCountTarget} />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-warm-400">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p>No content in this revision.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Coaching feedback */}
          <h2 className="font-display text-lg font-semibold text-warm-800">Coaching Feedback</h2>
          {passes.length === 0 ? (
            <p className="text-sm text-warm-400">No coaching feedback yet.</p>
          ) : (
            passes.map((pass, idx) => (
              <CoachingFeedback key={pass.id} pass={pass} passNumber={idx + 1} />
            ))
          )}

          {/* Scores */}
          {scores && <RubricChart scores={scores} />}
        </div>
      </div>
    </div>
  )
}
