import { useMemo } from 'react'
import { computeWordDiff } from '../utils/word-diff'
import type { DiffPart } from '../utils/word-diff'

interface InlineDiffProps {
  readonly oldText: string
  readonly newText: string
}

/**
 * Renders an inline word-level diff.
 * Removed text shows as red strikethrough, added text shows as green highlight.
 * Designed to render inside the writing-paper area for Writeasy-style in-place diffs.
 */
export function InlineDiff({ oldText, newText }: InlineDiffProps) {
  const diff = useMemo(() => computeWordDiff(oldText, newText), [oldText, newText])

  return (
    <div className="font-body text-xl leading-relaxed text-warm-700">
      {diff.map((part, idx) => renderPart(part, idx))}
    </div>
  )
}

function renderPart(part: DiffPart, idx: number) {
  if (part.value === '\n') {
    return <br key={idx} />
  }

  const suffix = ' '

  switch (part.type) {
    case 'equal':
      return <span key={idx}>{part.value}{suffix}</span>
    case 'removed':
      return (
        <span
          key={idx}
          className="bg-red-100 text-red-700 line-through decoration-red-400 px-0.5 rounded"
        >
          {part.value}{suffix}
        </span>
      )
    case 'added':
      return (
        <span
          key={idx}
          className="bg-green-100 text-green-700 px-0.5 rounded"
        >
          {part.value}{suffix}
        </span>
      )
  }
}
