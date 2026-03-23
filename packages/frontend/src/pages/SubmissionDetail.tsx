import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CoachingFeedback } from '../components/CoachingFeedback'
import { RubricChart } from '../components/RubricChart'
import { WordCounter } from '../components/WordCounter'
import { ArrowLeft, Loader2, FileText, PenLine } from 'lucide-react'
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
          {/* Revision tabs */}
          {revisions.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {revisions.map((rev, idx) => (
                <button
                  key={rev.id}
                  type="button"
                  onClick={() => setSelectedRevision(idx)}
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
          )}

          {/* Content display */}
          <div className="writing-paper rounded-[16px] border border-warm-200 p-6">
            {currentRevision ? (
              <>
                <div className="font-handwriting text-xl max-w-none text-warm-700 whitespace-pre-wrap leading-relaxed">
                  {currentRevision.content}
                </div>
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

          {/* Diff view between revisions */}
          {revisions.length > 1 && selectedRevision > 0 && (
            <div className="bg-white rounded-[16px] border border-warm-200 p-5">
              <h3 className="font-display font-semibold text-warm-800 mb-3 text-sm">
                Changes from Revision {revisions[selectedRevision - 1]?.revisionNumber} to{' '}
                {currentRevision?.revisionNumber}
              </h3>
              <DiffView
                oldText={revisions[selectedRevision - 1]?.content ?? ''}
                newText={currentRevision?.content ?? ''}
              />
            </div>
          )}
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

/**
 * Simple word-level diff view.
 * Highlights added words in green, removed words in red.
 */
function DiffView({ oldText, newText }: { oldText: string; newText: string }) {
  const oldWords = oldText.split(/\s+/).filter(Boolean)
  const newWords = newText.split(/\s+/).filter(Boolean)

  // Simple LCS-based diff
  const diff = computeWordDiff(oldWords, newWords)

  return (
    <div className="text-sm leading-relaxed">
      {diff.map((part, idx) => {
        if (part.type === 'equal') {
          return <span key={idx}>{part.value} </span>
        }
        if (part.type === 'removed') {
          return (
            <span key={idx} className="bg-red-100 text-red-700 line-through px-0.5 rounded">
              {part.value}{' '}
            </span>
          )
        }
        return (
          <span key={idx} className="bg-green-100 text-green-700 px-0.5 rounded">
            {part.value}{' '}
          </span>
        )
      })}
    </div>
  )
}

interface DiffPart {
  type: 'equal' | 'added' | 'removed'
  value: string
}

function computeWordDiff(oldWords: string[], newWords: string[]): DiffPart[] {
  // Simple approach: find longest common subsequence then build diff
  const m = oldWords.length
  const n = newWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i]![j] = (dp[i - 1]?.[j - 1] ?? 0) + 1
      } else {
        dp[i]![j] = Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0)
      }
    }
  }

  // Backtrack
  const result: DiffPart[] = []
  let i = m
  let j = n

  const stack: DiffPart[] = []
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      stack.push({ type: 'equal', value: oldWords[i - 1]! })
      i--
      j--
    } else if (j > 0 && (i === 0 || (dp[i]?.[j - 1] ?? 0) >= (dp[i - 1]?.[j] ?? 0))) {
      stack.push({ type: 'added', value: newWords[j - 1]! })
      j--
    } else {
      stack.push({ type: 'removed', value: oldWords[i - 1]! })
      i--
    }
  }

  // Reverse since we built it backwards
  for (let k = stack.length - 1; k >= 0; k--) {
    result.push(stack[k]!)
  }

  return result
}
