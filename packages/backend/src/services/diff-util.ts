export interface WordDiffResult {
  readonly added: ReadonlyArray<string>
  readonly removed: ReadonlyArray<string>
  readonly unchanged: number
  readonly totalOriginal: number
  readonly totalFinal: number
}

function tokenize(text: string): ReadonlyArray<string> {
  return text.split(/\s+/).filter(token => token.length > 0)
}

function buildLcsTable(
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>
): ReadonlyArray<ReadonlyArray<number>> {
  const m = a.length
  const n = b.length
  const table: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1])
      }
    }
  }

  return table
}

function backtrackLcs(
  table: ReadonlyArray<ReadonlyArray<number>>,
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>
): Set<number> {
  const lcsIndicesA = new Set<number>()
  let i = a.length
  let j = b.length

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcsIndicesA.add(i - 1)
      i -= 1
      j -= 1
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i -= 1
    } else {
      j -= 1
    }
  }

  return lcsIndicesA
}

function backtrackLcsB(
  table: ReadonlyArray<ReadonlyArray<number>>,
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>
): Set<number> {
  const lcsIndicesB = new Set<number>()
  let i = a.length
  let j = b.length

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcsIndicesB.add(j - 1)
      i -= 1
      j -= 1
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i -= 1
    } else {
      j -= 1
    }
  }

  return lcsIndicesB
}

export function generateWordDiff(original: string, final: string): WordDiffResult {
  const originalWords = tokenize(original)
  const finalWords = tokenize(final)

  if (originalWords.length === 0 && finalWords.length === 0) {
    return {
      added: [],
      removed: [],
      unchanged: 0,
      totalOriginal: 0,
      totalFinal: 0,
    }
  }

  const table = buildLcsTable(originalWords, finalWords)
  const lcsInOriginal = backtrackLcs(table, originalWords, finalWords)
  const lcsInFinal = backtrackLcsB(table, originalWords, finalWords)

  const removed: string[] = []
  for (let i = 0; i < originalWords.length; i++) {
    if (!lcsInOriginal.has(i)) {
      removed.push(originalWords[i])
    }
  }

  const added: string[] = []
  for (let j = 0; j < finalWords.length; j++) {
    if (!lcsInFinal.has(j)) {
      added.push(finalWords[j])
    }
  }

  const unchanged = lcsInOriginal.size

  return {
    added,
    removed,
    unchanged,
    totalOriginal: originalWords.length,
    totalFinal: finalWords.length,
  }
}
