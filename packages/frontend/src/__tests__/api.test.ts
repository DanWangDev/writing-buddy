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
  describe('login', () => {
    it('stores tokens and returns user', async () => {
      const user = { id: '1', email: 'a@b.com', displayName: 'Test', role: 'student', subscriptionPlan: 'free', createdAt: '2025-01-01' }
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: { user, accessToken: 'at', refreshToken: 'rt' } }),
      )

      const result = await api.login('a@b.com', 'pass123')

      expect(result).toEqual(user)
      expect(api.getAccessToken()).toBe('at')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/writing/auth/login',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  describe('register', () => {
    it('stores tokens and returns user', async () => {
      const user = { id: '2', email: 'b@c.com', displayName: 'New', role: 'student', subscriptionPlan: 'free', createdAt: '2025-01-01' }
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: { user, accessToken: 'at2', refreshToken: 'rt2' } }),
      )

      const result = await api.register('b@c.com', 'New', 'password1', 'student')

      expect(result).toEqual(user)
      expect(api.getAccessToken()).toBe('at2')
    })
  })

  describe('logout', () => {
    it('clears tokens', async () => {
      api.setTokens('tok', 'ref')
      mockFetch.mockReturnValueOnce(jsonResponse({ success: true }))

      await api.logout()

      expect(api.getAccessToken()).toBeNull()
    })
  })

  describe('getMe', () => {
    it('sends authorization header', async () => {
      api.setTokens('mytoken', null)
      const user = { id: '1', email: 'a@b.com', displayName: 'Test', role: 'student', subscriptionPlan: 'free', createdAt: '2025-01-01' }
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: user }),
      )

      await api.getMe()

      const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers
      expect(callHeaders?.Authorization).toBe('Bearer mytoken')
    })
  })

  describe('token refresh on 401', () => {
    it('retries with new token after refresh', async () => {
      api.setTokens('old', 'refresh-tok')

      // First call returns 401
      mockFetch.mockReturnValueOnce(jsonResponse({ success: false, error: 'Unauthorized' }, 401))
      // Refresh call succeeds
      mockFetch.mockReturnValueOnce(
        jsonResponse({ success: true, data: { accessToken: 'new-at', refreshToken: 'new-rt', user: {} } }),
      )
      // Retry call succeeds
      const user = { id: '1', email: 'a@b.com', displayName: 'Test', role: 'student', subscriptionPlan: 'free', createdAt: '2025-01-01' }
      mockFetch.mockReturnValueOnce(jsonResponse({ success: true, data: user }))

      const result = await api.getMe()

      expect(result).toEqual(user)
      expect(api.getAccessToken()).toBe('new-at')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('throws when refresh fails', async () => {
      api.setTokens('old', 'bad-refresh')

      mockFetch.mockReturnValueOnce(jsonResponse({ success: false }, 401))
      mockFetch.mockReturnValueOnce(jsonResponse({ success: false }, 401))

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
