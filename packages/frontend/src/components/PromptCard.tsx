import type { Prompt } from '@writting-buddy/shared'
import { BookOpen } from 'lucide-react'

const GENRE_STYLES: Record<string, { badge: string; accent: string }> = {
  adventure: { badge: 'bg-sky/10 text-sky', accent: 'border-t-sky' },
  mystery: { badge: 'bg-violet/10 text-violet-dark', accent: 'border-t-violet' },
  'sci-fi': { badge: 'bg-sky-light/20 text-sky-dark', accent: 'border-t-sky-dark' },
  fantasy: { badge: 'bg-violet-light/20 text-violet-dark', accent: 'border-t-violet-dark' },
  humor: { badge: 'bg-gold/15 text-gold-dark', accent: 'border-t-gold' },
  descriptive: { badge: 'bg-coral/10 text-coral-dark', accent: 'border-t-coral' },
  persuasive: { badge: 'bg-coral-light/20 text-coral-dark', accent: 'border-t-coral-dark' },
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'text-green-600',
  standard: 'text-gold-dark',
  challenge: 'text-coral-dark',
}

interface PromptCardProps {
  prompt: Prompt
  onClick: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  const genreStyle = GENRE_STYLES[prompt.genre] ?? { badge: 'bg-warm-100 text-warm-700', accent: 'border-t-warm-300' }
  const diffColor = DIFFICULTY_COLORS[prompt.difficulty] ?? 'text-warm-600'

  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className={`text-left w-full rounded-[16px] border border-warm-200 border-t-4 ${genreStyle.accent} bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-display font-semibold text-warm-800 text-lg leading-snug">
          {prompt.title}
        </h3>
        <BookOpen className="w-5 h-5 text-warm-300 shrink-0" />
      </div>
      <p className="text-sm text-warm-500 mb-4 line-clamp-2">{prompt.body}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${genreStyle.badge}`}
        >
          {prompt.genre}
        </span>
        <span className={`text-xs font-semibold ${diffColor}`}>
          {prompt.difficulty}
        </span>
        {prompt.wordCountTarget ? (
          <span className="text-xs text-warm-400">
            {prompt.wordCountTarget} words
          </span>
        ) : null}
      </div>
    </button>
  )
}
