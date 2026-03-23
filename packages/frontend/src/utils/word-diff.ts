export interface DiffPart {
  readonly type: 'equal' | 'added' | 'removed'
  readonly value: string
}

/**
 * Compute word-level diff between two texts, preserving paragraph breaks.
 * Uses LCS (Longest Common Subsequence) to find the optimal alignment.
 */
export function computeWordDiff(oldText: string, newText: string): DiffPart[] {
  const oldTokens = tokenize(oldText)
  const newTokens = tokenize(newText)

  const m = oldTokens.length
  const n = newTokens.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        dp[i]![j] = (dp[i - 1]?.[j - 1] ?? 0) + 1
      } else {
        dp[i]![j] = Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0)
      }
    }
  }

  // Backtrack to build diff
  const stack: DiffPart[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      stack.push({ type: 'equal', value: oldTokens[i - 1]! })
      i--
      j--
    } else if (j > 0 && (i === 0 || (dp[i]?.[j - 1] ?? 0) >= (dp[i - 1]?.[j] ?? 0))) {
      stack.push({ type: 'added', value: newTokens[j - 1]! })
      j--
    } else {
      stack.push({ type: 'removed', value: oldTokens[i - 1]! })
      i--
    }
  }

  // Reverse since we built it backwards
  const result: DiffPart[] = []
  for (let k = stack.length - 1; k >= 0; k--) {
    result.push(stack[k]!)
  }

  return result
}

/**
 * Tokenize text into words, preserving newlines as separate tokens.
 * This allows the diff to handle paragraph breaks correctly.
 */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  const lines = text.split('\n')

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    if (lineIdx > 0) {
      tokens.push('\n')
    }
    const words = lines[lineIdx]!.split(/\s+/).filter(Boolean)
    for (const word of words) {
      tokens.push(word)
    }
  }

  return tokens
}
