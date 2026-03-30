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
        <h1 className="font-display text-3xl text-warm-800 tracking-wider uppercase">Browse Prompts</h1>
        <p className="text-warm-500 mt-1 text-base font-bold">Pick a prompt and start your story!</p>
      </div>

      {/* Difficulty tabs */}
      <div className="inline-flex border-[3px] border-ink rounded-[10px] overflow-hidden shadow-[4px_4px_0_var(--color-ink)]">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setDifficulty(d.value)}
            className={`px-5 h-10 text-sm font-bold transition-colors border-r-[2px] border-ink last:border-r-0 ${
              difficulty === d.value
                ? 'bg-sky text-white'
                : 'bg-white text-warm-500 hover:bg-warm-100'
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
            className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 border-ink transition-all shadow-[2px_2px_0_var(--color-ink)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--color-ink)] ${
              genre === g.value
                ? 'bg-sky text-white'
                : 'bg-white text-warm-500'
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
