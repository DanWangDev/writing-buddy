import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PromptCard } from '../components/PromptCard'
import { MarginDoodles } from '../components/inkwell'
import { Loader2, Search } from 'lucide-react'
import * as api from '../services/api'
import type { Prompt, PromptGenre, PromptDifficulty } from '@writing-buddy/shared'

const GENRES: { value: PromptGenre | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'humor', label: 'Humor' },
  { value: 'descriptive', label: 'Descriptive' },
  { value: 'persuasive', label: 'Persuasive' },
]

const DIFFICULTIES: { value: PromptDifficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'standard', label: 'Standard' },
  { value: 'challenge', label: 'Challenge' },
]

export function PromptBrowser() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [genre, setGenre] = useState<PromptGenre | 'all'>('all')
  const [difficulty, setDifficulty] = useState<PromptDifficulty>('standard')
  useEffect(() => {
    let cancelled = false
    const filters: { genre?: PromptGenre; difficulty?: PromptDifficulty } = { difficulty }
    if (genre !== 'all') {
      filters.genre = genre
    }

    api
      .getPrompts(filters)
      .then((data) => {
        if (!cancelled) {
          setPrompts(data)
          setError('')
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load prompts.')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [genre, difficulty])

  const handlePromptClick = async (prompt: Prompt) => {
    try {
      const sub = await api.createSubmission({
        promptId: prompt.id,
        content: '',
      })
      navigate(`/write/${sub.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start writing.')
    }
  }

  return (
    <div className="space-y-6 relative">
      <MarginDoodles variant="prompts" />
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-800">Browse Prompts</h1>
        <p className="text-warm-500 mt-1 text-base">Pick a prompt and start your story!</p>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-1 bg-white rounded-[10px] border-2 border-warm-200 p-1 w-fit" style={{ boxShadow: '3px 3px 0 0 var(--color-warm-200)' }}>
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setDifficulty(d.value)}
            className={`px-4 h-10 rounded-lg text-sm font-semibold transition-colors ${
              difficulty === d.value
                ? 'bg-sky text-white shadow-sm'
                : 'text-warm-500 hover:bg-warm-100'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Genre pills */}
      <div className="flex gap-2 flex-wrap">
        {GENRES.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => setGenre(g.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
              genre === g.value
                ? 'bg-sky/10 border-sky text-sky'
                : 'bg-white border-warm-200 text-warm-500 hover:bg-warm-50'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-[10px] px-4 py-3 border-l-4 border-red-500" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky animate-spin" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-base">No prompts found for these filters. Try a different combination!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onClick={handlePromptClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
