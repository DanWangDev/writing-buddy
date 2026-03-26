import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '../services/api'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('api service', () => {
  describe('getMe', () => {
    it('sends request with credentials included', async () => {
      const user = { id: '1', email: 'a@b.com', displayName: 'Test', role: 'student', plan: 'free', createdAt: '2025-01-01' }
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: user }),
      )

      await api.getMe()

      const callOptions = mockFetch.mock.calls[0]?.[1]
      expect(callOptions?.credentials).toBe('include')
    })
  })

  describe('401 handling', () => {
    it('throws session expired on 401', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ success: false, error: 'Unauthorized' }, 401))

      await expect(api.getMe()).rejects.toThrow('Session expired')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('throws on non-success response', async () => {
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: false, error: 'Not found' }, 404),
      )

      await expect(api.getPrompts()).rejects.toThrow('Not found')
    })
  })

  describe('getPrompts', () => {
    it('adds query params for filters', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ success: true, data: [] }))

      await api.getPrompts({ genre: 'adventure', difficulty: 'standard' })

      const url = mockFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('genre=adventure')
      expect(url).toContain('difficulty=standard')
    })
  })

  describe('createSubmission', () => {
    it('posts to submissions endpoint', async () => {
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: { id: 's1', revisions: [] } }),
      )

      const result = await api.createSubmission({ content: 'Hello' })

      expect(result.id).toBe('s1')
      expect(mockFetch.mock.calls[0]?.[1]?.method).toBe('POST')
    })
  })

  describe('requestCoaching', () => {
    it('posts to coach endpoint', async () => {
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: { id: 'p1', passType: 'acknowledgment', feedback: 'Great!' } }),
      )

      const result = await api.requestCoaching('sub1')

      expect(result.feedback).toBe('Great!')
      const url = mockFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/submissions/sub1/coach')
    })
  })
})
