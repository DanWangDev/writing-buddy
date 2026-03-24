import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WordCounter } from '../components/WordCounter'
import { CoachingFeedback } from '../components/CoachingFeedback'
import type { ApplyMode } from '../components/CoachingFeedback'
import { RubricChart } from '../components/RubricChart'
import { InlineDiff } from '../components/InlineDiff'
import { MarginDoodles } from '../components/inkwell'
import {
  Save,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  BookOpen,
  Target,
  Check,
  X,
} from 'lucide-react'
import * as api from '../services/api'
import type { RubricCategory } from '../services/api'
import type {
  Submission,
  Prompt,
  CoachingPass,
  RubricScores,
} from '@writting-buddy/shared'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const GENRE_STYLES: Record<string, string> = {
  adventure: 'bg-sky/10 text-sky',
  mystery: 'bg-violet/10 text-violet-dark',
  'sci-fi': 'bg-sky-light/20 text-sky-dark',
  fantasy: 'bg-violet-light/20 text-violet-dark',
  humor: 'bg-gold/15 text-gold-dark',
  descriptive: 'bg-coral/10 text-coral-dark',
  persuasive: 'bg-coral-light/20 text-coral-dark',
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'text-green-600 bg-green-50 border-green-200',
  standard: 'text-gold-dark bg-gold/10 border-gold-light',
  challenge: 'text-coral-dark bg-coral/10 border-coral-light',
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
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const lastSavedContent = useRef('')

  // Inline diff preview state
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<string>('')

  // Category suggestion state
  const [activeCategory, setActiveCategory] = useState<RubricCategory | null>(null)
  const [loadingCategory, setLoadingCategory] = useState<RubricCategory | null>(null)
  const [categorySuggestion, setCategorySuggestion] = useState<string | null>(null)

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
        const lastContent = lastRevision?.content ?? ''
        setContent(lastContent)
        lastSavedContent.current = lastContent

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
        lastSavedContent.current = content
        navigate(`/write/${data.id}`, { replace: true })
      } else {
        // Add revision
        await api.createRevision(submission.id, content)
        lastSavedContent.current = content
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
      // Save first (skip if content unchanged)
      if (content !== lastSavedContent.current) {
        await api.createRevision(submission.id, content)
        lastSavedContent.current = content
      }
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
      if (content !== lastSavedContent.current) {
        await api.createRevision(submission.id, content)
        lastSavedContent.current = content
      }
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

  const handleApply = useCallback(async (feedback: string, mode: ApplyMode) => {
    if (!submission) return
    setError('')
    setApplying(true)
    try {
      const result = await api.applySuggestions(submission.id, content, feedback, mode)
      setPreviewContent(result.improvedContent)
      setPreviewMode(mode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply suggestions.')
    } finally {
      setApplying(false)
    }
  }, [submission, content])

  const handleAcceptPreview = useCallback(() => {
    if (previewContent) {
      setContent(previewContent)
      setPreviewContent(null)
      setPreviewMode('')
    }
  }, [previewContent])

  const handleRejectPreview = useCallback(() => {
    setPreviewContent(null)
    setPreviewMode('')
  }, [])

  const handleToggleCategory = useCallback(async (category: RubricCategory) => {
    // Toggle off if already active
    if (activeCategory === category) {
      setActiveCategory(null)
      setCategorySuggestion(null)
      return
    }

    if (!submission || !content.trim()) return

    setActiveCategory(category)
    setLoadingCategory(category)
    setCategorySuggestion(null)
    setError('')

    try {
      const result = await api.getCategorySuggestions(submission.id, content, category)
      setCategorySuggestion(result.improvedContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions.')
      setActiveCategory(null)
      setCategorySuggestion(null)
    } finally {
      setLoadingCategory(null)
    }
  }, [submission, content, activeCategory])

  const handleAcceptCategorySuggestion = useCallback(() => {
    if (categorySuggestion) {
      setContent(categorySuggestion)
      setActiveCategory(null)
      setCategorySuggestion(null)
    }
  }, [categorySuggestion])

  const handleRejectCategorySuggestion = useCallback(() => {
    setActiveCategory(null)
    setCategorySuggestion(null)
  }, [])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const textareaCallbackRef = useCallback((el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.max(320, el.scrollHeight)}px`
    }
  }, [])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(320, el.scrollHeight)}px`
  }, [content])

  const wordCount = countWords(content)
  const isCompleted = submission?.status === 'completed'
  const currentPass = passes.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      <MarginDoodles variant="writing" />
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-warm-500 hover:text-warm-700 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Prompt context banner */}
      {prompt ? (
        <div className="bg-white rounded-[16px] border border-warm-200 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky" />
              <h1 className="font-display text-xl font-bold text-warm-800">{prompt.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentPass > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky/10 text-sky">
                  Pass {currentPass}/4
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-warm-600 leading-relaxed mb-4">{prompt.body}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${GENRE_STYLES[prompt.genre] ?? 'bg-warm-100 text-warm-700'}`}>
              {prompt.genre}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DIFFICULTY_STYLES[prompt.difficulty] ?? 'text-warm-600 bg-warm-50 border-warm-200'}`}>
              {prompt.difficulty}
            </span>
            {prompt.wordCountTarget && (
              <span className="inline-flex items-center gap-1 text-xs text-warm-500">
                <Target className="w-3.5 h-3.5" />
                {prompt.wordCountTarget} words target
              </span>
            )}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                {prompt.tags.map((tag: string) => (
                  <span key={tag} className="text-xs text-warm-400 bg-warm-50 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-warm-800">Free Writing</h1>
          {currentPass > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky/10 text-sky">
              Pass {currentPass}/4
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Writing area */}
        <div className="lg:col-span-2 space-y-3">
          {/* Preview mode: show inline diff (from apply suggestions or category toggle) */}
          {previewContent || categorySuggestion ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-sky-dark bg-sky/10 px-3 py-1 rounded-full">
                    {categorySuggestion
                      ? `${activeCategory ? activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) : ''} Suggestions`
                      : `Preview: ${previewMode === 'grammar' ? 'Grammar Fix' : previewMode === 'vocabulary' ? 'Vocabulary Boost' : 'Applied Suggestions'}`}
                  </span>
                  <span className="text-xs text-warm-400">Review changes before accepting</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={categorySuggestion ? handleAcceptCategorySuggestion : handleAcceptPreview}
                    className="inline-flex items-center gap-1 px-4 h-10 text-sm font-semibold rounded-[10px] bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={categorySuggestion ? handleRejectCategorySuggestion : handleRejectPreview}
                    className="inline-flex items-center gap-1 px-4 h-10 text-sm font-semibold rounded-[10px] border-2 border-warm-200 bg-white text-warm-700 hover:bg-warm-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
              <div className="writing-paper rounded-[16px] border-2 border-sky/30 p-6">
                <InlineDiff oldText={content} newText={(categorySuggestion ?? previewContent)!} />
              </div>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaCallbackRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isCompleted}
                placeholder="Start writing your story here... Let your imagination run wild!"
                className="writing-paper w-full min-h-80 rounded-[16px] border border-warm-200 p-6 font-body text-xl leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent disabled:bg-warm-50 disabled:text-warm-400 text-warm-700 overflow-hidden"
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
                      className="inline-flex items-center gap-1.5 px-4 h-10 text-sm font-semibold rounded-[10px] border-2 border-warm-200 bg-white text-warm-700 hover:bg-warm-50 transition-colors disabled:opacity-50"
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
                      className="inline-flex items-center gap-1.5 px-4 h-10 text-sm font-semibold rounded-[10px] bg-sky text-white hover:bg-sky-dark transition-colors disabled:opacity-50 shadow-sm shadow-sky/20"
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
                      className="inline-flex items-center gap-1.5 px-4 h-10 text-sm font-semibold rounded-[10px] bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
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
            </>
          )}
        </div>

        {/* Coaching sidebar */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-warm-800">Coaching Feedback</h2>

          {passes.length === 0 ? (
            <div className="text-center py-8 text-warm-400 text-sm bg-white rounded-[16px] border border-warm-200 p-6">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base">No coaching feedback yet.</p>
              <p className="mt-1 text-sm">Write some words and click &quot;Get Coaching&quot; to begin!</p>
            </div>
          ) : (
            passes.map((pass, idx) => (
              <CoachingFeedback
                key={pass.id}
                pass={pass}
                passNumber={idx + 1}
                onApply={handleApply}
                applying={applying}
                isCompleted={isCompleted}
                defaultExpanded={idx === passes.length - 1}
              />
            ))
          )}

          {scores && (
            <div className="mt-4">
              <RubricChart
                scores={scores}
                activeCategory={activeCategory}
                loadingCategory={loadingCategory}
                onToggleCategory={content.trim() ? handleToggleCategory : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
