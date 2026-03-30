import type { Prompt } from '@writing-buddy/shared'
import { BookOpen, Clock } from 'lucide-react'

const GENRE_STYLES: Record<string, { badge: string; accent: string }> = {
  adventure: { badge: 'bg-sky text-white', accent: 'bg-sky' },
  mystery: { badge: 'bg-violet text-white', accent: 'bg-violet' },
  'sci-fi': { badge: 'bg-sky-dark text-white', accent: 'bg-sky-dark' },
  fantasy: { badge: 'bg-[#EC4899] text-white', accent: 'bg-[#EC4899]' },
  humor: { badge: 'bg-gold text-ink', accent: 'bg-gold' },
  descriptive: { badge: 'bg-coral text-white', accent: 'bg-coral' },
  persuasive: { badge: 'bg-[#EF4444] text-white', accent: 'bg-[#EF4444]' },
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500 text-white',
  standard: 'bg-gold text-ink',
  challenge: 'bg-[#EF4444] text-white',
}

interface PromptCardProps {
  prompt: Prompt
  onClick?: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  const genreStyle = GENRE_STYLES[prompt.genre] ?? { badge: 'bg-warm-200 text-warm-700', accent: 'bg-warm-300' }
  const diffStyle = DIFFICULTY_COLORS[prompt.difficulty] ?? 'bg-warm-200 text-warm-700'

  const content = (
    <>
      <div className={`h-[6px] rounded-t-[9px] ${genreStyle.accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-display text-lg tracking-wide text-warm-800 leading-snug uppercase">
            {prompt.title}
          </h3>
          <BookOpen className="w-5 h-5 text-warm-300 shrink-0" />
        </div>
        <p className="text-sm text-warm-500 mb-4 line-clamp-2">{prompt.body}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`badge-manga text-xs ${genreStyle.badge}`}
          >
            {prompt.genre}
          </span>
          <span className={`badge-manga text-xs ${diffStyle}`}>
            {prompt.difficulty}
          </span>
          {prompt.wordCountTarget ? (
            <span className="text-xs font-bold text-warm-400">
              {prompt.wordCountTarget} words
            </span>
          ) : null}
          {prompt.timeLimitMinutes ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-warm-400">
              <Clock className="w-3 h-3" />
              {prompt.timeLimitMinutes} min
            </span>
          ) : null}
        </div>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(prompt)}
        className="text-left w-full card-clay p-0 cursor-pointer"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="text-left w-full card-clay-static p-0">
      {content}
    </div>
  )
}
