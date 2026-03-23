import { describe, it, expect } from 'vitest'
import { generateWordDiff } from '../services/diff-util.js'

describe('generateWordDiff', () => {
  it('returns empty diff for identical texts', () => {
    const result = generateWordDiff(
      'The quick brown fox',
      'The quick brown fox'
    )

    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.unchanged).toBe(4)
    expect(result.totalOriginal).toBe(4)
    expect(result.totalFinal).toBe(4)
  })

  it('detects added words', () => {
    const result = generateWordDiff(
      'The fox jumped',
      'The quick brown fox jumped high'
    )

    expect(result.added).toContain('quick')
    expect(result.added).toContain('brown')
    expect(result.added).toContain('high')
    expect(result.removed).toEqual([])
    expect(result.totalOriginal).toBe(3)
    expect(result.totalFinal).toBe(6)
  })

  it('detects removed words', () => {
    const result = generateWordDiff(
      'The quick brown fox jumped',
      'The fox jumped'
    )

    expect(result.removed).toContain('quick')
    expect(result.removed).toContain('brown')
    expect(result.added).toEqual([])
    expect(result.unchanged).toBe(3)
  })

  it('handles both additions and removals', () => {
    const result = generateWordDiff(
      'I walked to the old store',
      'I ran to the new shop'
    )

    expect(result.removed).toContain('walked')
    expect(result.removed).toContain('old')
    expect(result.removed).toContain('store')
    expect(result.added).toContain('ran')
    expect(result.added).toContain('new')
    expect(result.added).toContain('shop')
    expect(result.unchanged).toBe(3)
  })

  it('handles empty original text', () => {
    const result = generateWordDiff('', 'hello world')

    expect(result.added).toEqual(['hello', 'world'])
    expect(result.removed).toEqual([])
    expect(result.unchanged).toBe(0)
    expect(result.totalOriginal).toBe(0)
    expect(result.totalFinal).toBe(2)
  })

  it('handles empty final text', () => {
    const result = generateWordDiff('hello world', '')

    expect(result.added).toEqual([])
    expect(result.removed).toEqual(['hello', 'world'])
    expect(result.unchanged).toBe(0)
    expect(result.totalOriginal).toBe(2)
    expect(result.totalFinal).toBe(0)
  })

  it('handles both texts empty', () => {
    const result = generateWordDiff('', '')

    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.unchanged).toBe(0)
    expect(result.totalOriginal).toBe(0)
    expect(result.totalFinal).toBe(0)
  })

  it('handles larger text with mixed changes', () => {
    const original = 'The brave knight rode his horse through the dark forest searching for treasure'
    const final = 'The brave warrior rode her horse through the enchanted forest looking for gold'

    const result = generateWordDiff(original, final)

    expect(result.removed).toContain('knight')
    expect(result.removed).toContain('his')
    expect(result.removed).toContain('dark')
    expect(result.removed).toContain('searching')
    expect(result.removed).toContain('treasure')
    expect(result.added).toContain('warrior')
    expect(result.added).toContain('her')
    expect(result.added).toContain('enchanted')
    expect(result.added).toContain('looking')
    expect(result.added).toContain('gold')
    expect(result.totalOriginal).toBe(13)
    expect(result.totalFinal).toBe(13)
  })
})
