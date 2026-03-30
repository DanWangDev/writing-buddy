import { useState, useEffect, useCallback } from 'react'
import type { Prompt, PromptGenre, PromptDifficulty, CreatePromptDto } from '@writing-buddy/shared'
import { PromptCard } from '../components/PromptCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { toast } from '../components/toast-store'
import * as api from '../services/api'
import type { PromptStats } from '../services/api'
import {
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'

const GENRES: PromptGenre[] = ['adventure', 'mystery', 'sci-fi', 'fantasy', 'humor', 'descriptive', 'persuasive']
const DIFFICULTIES: PromptDifficulty[] = ['beginner', 'standard', 'challenge']

type View = 'list' | 'create' | 'edit'

export function AdminPrompts() {
  const [view, setView] = useState<View>('list')
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [stats, setStats] = useState<PromptStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [heatmapFilter, setHeatmapFilter] = useState<{ genre: PromptGenre; difficulty: PromptDifficulty } | null>(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Prompt | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [promptsData, statsData] = await Promise.all([
        api.getPrompts(),
        api.getPromptStats(),
      ])
      setPrompts(promptsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setView('edit')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deletePrompt(deleteTarget.id)
      toast('Prompt archived!', 'success')
      setDeleteTarget(null)
      await fetchData()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to archive prompt', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = async () => {
    setView('list')
    setEditingPrompt(null)
    await fetchData()
  }

  const handleHeatmapClick = (genre: PromptGenre, difficulty: PromptDifficulty) => {
    if (heatmapFilter?.genre === genre && heatmapFilter?.difficulty === difficulty) {
      setHeatmapFilter(null)
    } else {
      setHeatmapFilter({ genre, difficulty })
    }
  }

  const filteredPrompts = heatmapFilter
    ? prompts.filter(p => p.genre === heatmapFilter.genre && p.difficulty === heatmapFilter.difficulty)
    : prompts

  if (view === 'create' || view === 'edit') {
    return (
      <PromptForm
        prompt={view === 'edit' ? editingPrompt : null}
        onSuccess={handleFormSuccess}
        onCancel={() => { setView('list'); setEditingPrompt(null) }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl text-warm-800 tracking-wider uppercase">Manage Prompts</h1>
          <span className="badge-manga text-sm bg-warm-100 text-warm-600">
            {prompts.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setView('create')}
          className="btn-manga flex items-center gap-2 h-12 px-5 bg-sky text-white cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Prompt
        </button>
      </div>

      {/* Heatmap */}
      {stats && <ContentHeatmap stats={stats} filter={heatmapFilter} onClick={handleHeatmapClick} />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500 flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchData} className="text-red-600 font-semibold hover:underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-clay-static p-5 animate-pulse">
              <div className="h-5 bg-warm-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-warm-100 rounded w-full mb-2" />
              <div className="h-3 bg-warm-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && prompts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-warm-500 text-lg mb-4">No prompts found.</p>
          <button
            type="button"
            onClick={() => setView('create')}
            className="btn-manga inline-flex items-center gap-2 px-5 h-12 bg-sky text-white cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create your first prompt
          </button>
        </div>
      )}

      {/* Prompt grid */}
      {!loading && filteredPrompts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map(prompt => (
            <div key={prompt.id} className="relative group">
              <PromptCard prompt={prompt} />
              {/* Submission count badge */}
              {stats && (
                <span className="absolute top-3 right-3 badge-manga text-xs bg-warm-100 text-warm-500">
                  {stats.submissionCounts[prompt.id] ?? 0} submissions
                </span>
              )}
              {/* Action buttons */}
              <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleEdit(prompt)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border-2 border-ink text-warm-500 hover:text-sky transition-colors cursor-pointer shadow-[2px_2px_0_var(--color-ink)]"
                  aria-label={`Edit ${prompt.title}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(prompt)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border-2 border-ink text-warm-500 hover:text-red-500 transition-colors cursor-pointer shadow-[2px_2px_0_var(--color-ink)]"
                  aria-label={`Archive ${prompt.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Archive this prompt?"
        message={`"${deleteTarget?.title}" will be hidden from students but existing submissions will still reference it.`}
        confirmLabel={deleting ? 'Archiving...' : 'Archive'}
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// --- Content Gap Heatmap ---

function ContentHeatmap({
  stats,
  filter,
  onClick,
}: {
  stats: PromptStats
  filter: { genre: PromptGenre; difficulty: PromptDifficulty } | null
  onClick: (genre: PromptGenre, difficulty: PromptDifficulty) => void
}) {
  const getCount = (genre: string, difficulty: string): number => {
    const entry = stats.heatmap.find(h => h.genre === genre && h.difficulty === difficulty)
    return entry?.count ?? 0
  }

  const getCellColor = (count: number): string => {
    if (count === 0) return 'bg-red-100 text-red-700 border-red-200'
    if (count <= 2) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-green-50 text-green-700 border-green-200'
  }

  return (
    <div className="card-clay-static p-4 overflow-x-auto">
      <h2 className="font-display text-warm-700 text-sm mb-3 tracking-wider uppercase">Content Coverage</h2>
      <table className="w-full text-center text-xs">
        <thead>
          <tr>
            <th className="pb-2 text-warm-400 font-medium text-left" />
            {DIFFICULTIES.map(d => (
              <th key={d} className="pb-2 text-warm-400 font-medium capitalize">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GENRES.map(genre => (
            <tr key={genre}>
              <td className="py-1 pr-3 text-left text-warm-600 font-medium capitalize whitespace-nowrap">{genre}</td>
              {DIFFICULTIES.map(diff => {
                const count = getCount(genre, diff)
                const isActive = filter?.genre === genre && filter?.difficulty === diff
                return (
                  <td key={diff} className="p-1">
                    <button
                      type="button"
                      onClick={() => onClick(genre, diff)}
                      className={`w-full h-8 rounded-md border font-semibold transition-all cursor-pointer ${getCellColor(count)} ${
                        isActive ? 'ring-2 ring-sky ring-offset-1' : ''
                      }`}
                      aria-label={`${genre} ${diff}: ${count} prompts`}
                    >
                      {count}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- Prompt Form (create/edit) ---

const EMPTY_FORM: CreatePromptDto = {
  title: '',
  body: '',
  genre: 'adventure',
  difficulty: 'standard',
  tags: [],
}

function PromptForm({
  prompt,
  onSuccess,
  onCancel,
}: {
  prompt: Prompt | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const isEdit = !!prompt
  const [form, setForm] = useState<CreatePromptDto>(
    prompt
      ? { title: prompt.title, body: prompt.body, genre: prompt.genre, difficulty: prompt.difficulty, wordCountTarget: prompt.wordCountTarget, timeLimitMinutes: prompt.timeLimitMinutes, tags: prompt.tags }
      : { ...EMPTY_FORM }
  )
  const [tagsInput, setTagsInput] = useState(prompt?.tags.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = <K extends keyof CreatePromptDto>(key: K, value: CreatePromptDto[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (form.title.length < 3) errs.title = 'Title must be at least 3 characters'
    if (form.title.length > 200) errs.title = 'Title must be at most 200 characters'
    if (form.body.length < 20) errs.body = 'Body must be at least 20 characters'
    if (form.body.length > 2000) errs.body = 'Body must be at most 2000 characters'
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    if (tags.length === 0) errs.tags = 'At least one tag is required'
    if (tags.length > 10) errs.tags = 'Maximum 10 tags allowed'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const tags = [...new Set(tagsInput.split(',').map(t => t.trim()).filter(Boolean))]
    const data: CreatePromptDto = { ...form, tags }

    setSaving(true)
    try {
      if (isEdit && prompt) {
        await api.updatePrompt(prompt.id, data)
        toast('Prompt updated!', 'success')
      } else {
        await api.createPromptAdmin(data)
        toast('Prompt created!', 'success')
      }
      onSuccess()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save prompt', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Live preview prompt object
  const previewPrompt: Prompt = {
    id: 'preview',
    title: form.title || 'Untitled Prompt',
    body: form.body || 'Start typing to see a preview of your prompt...',
    genre: form.genre,
    difficulty: form.difficulty,
    wordCountTarget: form.wordCountTarget,
    timeLimitMinutes: form.timeLimitMinutes,
    tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    createdAt: new Date().toISOString(),
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-warm-100 transition-colors text-warm-500 cursor-pointer"
          aria-label="Back to list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-2xl text-warm-800 tracking-wider uppercase">
          {isEdit ? `Edit: ${prompt?.title}` : 'New Prompt'}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Form (left 60%) */}
        <form onSubmit={handleSubmit} role="form" className="flex-1 md:w-3/5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="prompt-title" className="block text-sm font-semibold text-warm-700 mb-1">Title</label>
            <input
              id="prompt-title"
              type="text"
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-sky focus:ring-2 focus:ring-sky/20 outline-none transition-colors"
              placeholder="A captivating prompt title..."
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Body */}
          <div>
            <label htmlFor="prompt-body" className="block text-sm font-semibold text-warm-700 mb-1">Body</label>
            <textarea
              id="prompt-body"
              value={form.body}
              onChange={e => updateField('body', e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 writing-paper focus:border-sky focus:ring-2 focus:ring-sky/20 outline-none transition-colors resize-none"
              placeholder="Write the prompt body here..."
            />
            {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body}</p>}
          </div>

          {/* Genre + Difficulty row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="prompt-genre" className="block text-sm font-semibold text-warm-700 mb-1">Genre</label>
              <select
                id="prompt-genre"
                value={form.genre}
                onChange={e => updateField('genre', e.target.value as PromptGenre)}
                className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-sky outline-none cursor-pointer"
              >
                {GENRES.map(g => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <span className="block text-sm font-semibold text-warm-700 mb-1">Difficulty</span>
              <div className="flex gap-1">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateField('difficulty', d)}
                    className={`flex-1 h-12 rounded-[10px] text-sm font-bold capitalize transition-colors cursor-pointer border-2 border-ink ${
                      form.difficulty === d
                        ? 'bg-sky text-white shadow-[2px_2px_0_var(--color-ink)]'
                        : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Word count + Time limit row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="prompt-wc" className="block text-sm font-semibold text-warm-700 mb-1">Word Count Target</label>
              <input
                id="prompt-wc"
                type="number"
                value={form.wordCountTarget ?? ''}
                onChange={e => updateField('wordCountTarget', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-sky outline-none"
                placeholder="e.g. 200"
                min={50}
                max={1000}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="prompt-time" className="block text-sm font-semibold text-warm-700 mb-1">Time Limit (min)</label>
              <input
                id="prompt-time"
                type="number"
                value={form.timeLimitMinutes ?? ''}
                onChange={e => updateField('timeLimitMinutes', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-sky outline-none"
                placeholder="e.g. 30"
                min={5}
                max={120}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="prompt-tags" className="block text-sm font-semibold text-warm-700 mb-1">Tags (comma-separated)</label>
            <input
              id="prompt-tags"
              type="text"
              value={tagsInput}
              onChange={e => {
                setTagsInput(e.target.value)
                setErrors(prev => { const next = { ...prev }; delete next.tags; return next })
              }}
              className="w-full h-12 px-4 rounded-[10px] border-2 border-warm-200 bg-warm-50 text-warm-800 focus:border-sky outline-none"
              placeholder="creative, fun, animals"
            />
            {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-manga flex items-center gap-2 h-12 px-6 bg-sky text-white disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? (isEdit ? 'Saving...' : 'Creating...') : 'Save Prompt'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-manga h-12 px-6 bg-white text-warm-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Live preview (right 40%) */}
        <div className="md:w-2/5">
          <p className="text-sm font-semibold text-warm-500 mb-2">Live Preview</p>
          {form.title || form.body ? (
            <PromptCard prompt={previewPrompt} />
          ) : (
            <div className="card-clay-static p-5 text-center text-warm-400 text-sm">
              Start typing to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
