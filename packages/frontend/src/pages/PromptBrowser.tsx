import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PromptCard } from '../components/PromptCard'
import { Loader2, Search } from 'lucide-react'
import * as api from '../services/api'
import type { Prompt, PromptGenre, PromptDifficulty } from '@writting-buddy/shared'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Prompts</h1>
        <p className="text-gray-500 mt-1">Pick a prompt and start your story!</p>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1 w-fit">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setDifficulty(d.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              difficulty === d.value
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
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
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              genre === g.value
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3" />
          <p>No prompts found for these filters. Try a different combination!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
