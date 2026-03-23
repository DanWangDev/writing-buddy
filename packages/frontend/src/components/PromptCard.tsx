import type { Prompt } from '@writting-buddy/shared'
import { BookOpen } from 'lucide-react'

const GENRE_COLORS: Record<string, string> = {
  adventure: 'bg-emerald-100 text-emerald-700',
  mystery: 'bg-violet-100 text-violet-700',
  'sci-fi': 'bg-cyan-100 text-cyan-700',
  fantasy: 'bg-pink-100 text-pink-700',
  humor: 'bg-yellow-100 text-yellow-700',
  descriptive: 'bg-blue-100 text-blue-700',
  persuasive: 'bg-red-100 text-red-700',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-600',
  standard: 'text-yellow-600',
  challenge: 'text-red-600',
}

interface PromptCardProps {
  prompt: Prompt
  onClick: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  const genreColor = GENRE_COLORS[prompt.genre] ?? 'bg-gray-100 text-gray-700'
  const diffColor = DIFFICULTY_COLORS[prompt.difficulty] ?? 'text-gray-600'

  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className="text-left w-full rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-800 leading-snug">
          {prompt.title}
        </h3>
        <BookOpen className="w-5 h-5 text-gray-300 shrink-0" />
      </div>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{prompt.body}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${genreColor}`}
        >
          {prompt.genre}
        </span>
        <span className={`text-xs font-medium ${diffColor}`}>
          {prompt.difficulty}
        </span>
        {prompt.wordCountTarget ? (
          <span className="text-xs text-gray-400">
            {prompt.wordCountTarget} words
          </span>
        ) : null}
      </div>
    </button>
  )
}
