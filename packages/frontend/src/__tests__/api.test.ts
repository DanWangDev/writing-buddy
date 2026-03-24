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
  api.setTokens(null, null)
})

describe('api service', () => {
  describe('getMe', () => {
    it('sends authorization header', async () => {
      api.setTokens('mytoken', null)
      const user = { id: '1', email: 'a@b.com', displayName: 'Test', role: 'student', plan: 'free', createdAt: '2025-01-01' }
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: user }),
      )

      await api.getMe()

      const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers
      expect(callHeaders?.Authorization).toBe('Bearer mytoken')
    })
  })

  describe('clearTokens', () => {
    it('clears all stored tokens', () => {
      api.setTokens('tok', 'ref')
      expect(api.getAccessToken()).toBe('tok')

      api.clearTokens()
      expect(api.getAccessToken()).toBeNull()
    })
  })

  describe('token refresh on 401', () => {
    it('retries with new token after OIDC refresh', async () => {
      api.setTokens('old', 'refresh-tok')

      // First call returns 401
      mockFetch.mockReturnValueOnce(jsonResponse({ success: false, error: 'Unauthorized' }, 401))
      // Refresh call succeeds (OIDC token endpoint)
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ access_token: 'new-at', refresh_token: 'new-rt' }),
        }),
      )
      // Retry call succeeds
      const user = { id: '1', email: 'a@b.com', displayName: 'Test', role: 'student', plan: 'free', createdAt: '2025-01-01' }
      mockFetch.mockReturnValueOnce(jsonResponse({ success: true, data: user }))

      const result = await api.getMe()

      expect(result).toEqual(user)
      expect(api.getAccessToken()).toBe('new-at')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('throws when refresh fails', async () => {
      api.setTokens('old', 'bad-refresh')

      mockFetch.mockReturnValueOnce(jsonResponse({ success: false }, 401))
      // Refresh fails
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'invalid_grant' }),
        }),
      )

      await expect(api.getMe()).rejects.toThrow('Session expired')
      expect(api.getAccessToken()).toBeNull()
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
