import type {
  PublicUser,
  Prompt,
  PromptGenre,
  PromptDifficulty,
  Submission,
  Revision,
  CoachingPass,
  CoachingSession,
  RubricScores,
  WritingProgress,
  ApiResponse,
} from '@writing-buddy/shared'

const BASE_URL = '/api/writing'
const ACCESS_TOKEN_KEY = 'labf_oidc_access_token'
const REFRESH_TOKEN_KEY = 'labf_oidc_refresh_token'

let accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY)
let refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_KEY)

function persistTokens(): void {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setTokens(access: string | null, refresh: string | null): void {
  accessToken = access
  refreshToken = refresh
  persistTokens()
}

function getOidcConfig() {
  const issuer = import.meta.env.VITE_OIDC_ISSUER || 'http://localhost:3009'
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'writing-buddy-client'
  return { issuer, clientId }
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false

  const { issuer, clientId } = getOidcConfig()

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    })

    const res = await fetch(`${issuer}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!res.ok) {
      clearTokens()
      return false
    }

    const data = await res.json() as {
      access_token: string
      refresh_token?: string
    }

    accessToken = data.access_token
    if (data.refresh_token) {
      refreshToken = data.refresh_token
    }
    persistTokens()
    return true
  } catch {
    return false
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401 && accessToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      })
      const retryJson: ApiResponse<T> = await retryRes.json()
      if (!retryJson.success) {
        throw new Error(retryJson.error ?? 'Request failed')
      }
      return retryJson.data as T
    }
    accessToken = null
    refreshToken = null
    persistTokens()
    throw new Error('Session expired. Please log in again.')
  }

  const json: ApiResponse<T> = await res.json()
  if (!json.success) {
    throw new Error(json.error ?? 'Request failed')
  }
  return json.data as T
}

// Auth
export async function getMe(): Promise<PublicUser> {
  return request<PublicUser>('/auth/me')
}

export function clearTokens(): void {
  accessToken = null
  refreshToken = null
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('labf_oidc_id_token')
  sessionStorage.removeItem('labf_oidc_code_verifier')
  sessionStorage.removeItem('labf_oidc_state')
}

// Prompts
export async function getPrompts(filters?: {
  genre?: PromptGenre
  difficulty?: PromptDifficulty
}): Promise<Prompt[]> {
  const params = new URLSearchParams()
  if (filters?.genre) params.set('genre', filters.genre)
  if (filters?.difficulty) params.set('difficulty', filters.difficulty)
  const query = params.toString()
  return request<Prompt[]>(`/prompts${query ? `?${query}` : ''}`)
}

export async function getPrompt(id: string): Promise<Prompt> {
  return request<Prompt>(`/prompts/${id}`)
}

// Submissions
export async function createSubmission(data: {
  promptId?: string
  content: string
}): Promise<Submission & { revisions: Revision[] }> {
  return request(`/submissions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getSubmissions(
  status?: string,
): Promise<Submission[]> {
  const query = status ? `?status=${status}` : ''
  return request<Submission[]>(`/submissions${query}`)
}

export async function getSubmission(
  id: string,
): Promise<Submission & { revisions: Revision[]; prompt?: Prompt }> {
  return request(`/submissions/${id}`)
}

export async function deleteSubmission(
  submissionId: string,
): Promise<void> {
  await request<{ id: string }>(`/submissions/${submissionId}`, {
    method: 'DELETE',
  })
}

export async function createRevision(
  submissionId: string,
  content: string,
): Promise<Revision> {
  return request<Revision>(`/submissions/${submissionId}/revisions`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function completeSubmission(
  submissionId: string,
): Promise<Submission> {
  return request<Submission>(`/submissions/${submissionId}/complete`, {
    method: 'PATCH',
  })
}

// Coaching
export async function requestCoaching(
  submissionId: string,
): Promise<CoachingPass> {
  return request<CoachingPass>(`/submissions/${submissionId}/coach`, {
    method: 'POST',
  })
}

export async function getCoachingSession(
  submissionId: string,
): Promise<CoachingSession> {
  return request<CoachingSession>(`/submissions/${submissionId}/coaching`)
}

export interface ApplySuggestionsResult {
  originalContent: string
  improvedContent: string
  mode: string
  tokensUsed: number
}

export async function applySuggestions(
  submissionId: string,
  content: string,
  feedback: string,
  mode: 'grammar' | 'vocabulary' | 'improve' = 'improve',
): Promise<ApplySuggestionsResult> {
  return request<ApplySuggestionsResult>(`/submissions/${submissionId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ content, feedback, mode }),
  })
}

// Category suggestions
export type RubricCategory = 'content' | 'organization' | 'vocabulary' | 'grammar' | 'spelling'

export interface CategorySuggestResult {
  category: RubricCategory
  originalContent: string
  improvedContent: string
  tokensUsed: number
}

export async function getCategorySuggestions(
  submissionId: string,
  content: string,
  category: RubricCategory,
): Promise<CategorySuggestResult> {
  return request<CategorySuggestResult>(`/submissions/${submissionId}/category-suggest`, {
    method: 'POST',
    body: JSON.stringify({ content, category }),
  })
}

// Scoring
export async function getScores(
  submissionId: string,
): Promise<RubricScores> {
  return request<RubricScores>(`/submissions/${submissionId}/scores`)
}

// Progress
export async function getProgress(days?: number): Promise<WritingProgress[]> {
  const query = days ? `?days=${days}` : ''
  return request<WritingProgress[]>(`/progress${query}`)
}

export async function getStreak(): Promise<{ streakDays: number }> {
  return request<{ streakDays: number }>('/progress/streak')
}
