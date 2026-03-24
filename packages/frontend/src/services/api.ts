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
  UserRole,
} from '@writting-buddy/shared'

const BASE_URL = '/api/writing'
const ACCESS_TOKEN_KEY = 'wb_access_token'
const REFRESH_TOKEN_KEY = 'wb_refresh_token'

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

interface AuthData {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) return false

    const json: ApiResponse<AuthData> = await res.json()
    if (json.success && json.data) {
      accessToken = json.data.accessToken
      refreshToken = json.data.refreshToken
      persistTokens()
      return true
    }
    return false
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
export async function login(
  email: string,
  password: string,
): Promise<PublicUser> {
  const data = await request<AuthData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  accessToken = data.accessToken
  refreshToken = data.refreshToken
  persistTokens()
  return data.user
}

export async function register(
  email: string,
  displayName: string,
  password: string,
  role: UserRole,
): Promise<PublicUser> {
  const data = await request<AuthData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, displayName, password, role }),
  })
  accessToken = data.accessToken
  refreshToken = data.refreshToken
  persistTokens()
  return data.user
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' })
  } finally {
    accessToken = null
    refreshToken = null
    persistTokens()
  }
}

export async function getMe(): Promise<PublicUser> {
  return request<PublicUser>('/auth/me')
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
  await request<null>(`/submissions/${submissionId}`, {
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
