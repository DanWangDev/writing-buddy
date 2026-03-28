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
} from "@writing-buddy/shared";

const BASE_URL = "/api/writing";

let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void): () => void {
  onSessionExpired = handler;
  return () => {
    if (onSessionExpired === handler) onSessionExpired = null;
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    onSessionExpired?.();
    throw new Error("Session expired. Please log in again.");
  }

  if (res.status === 403) {
    // Redirect to login with access denied — user is authenticated but lacks entitlement
    window.location.href = "/login?error=access_denied";
    throw new Error("Your plan does not include access to Writing Buddy");
  }

  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data as T;
}

// Auth (mounted at /api/auth, separate from /api/writing domain routes)
export async function getMe(): Promise<PublicUser> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) {
    // Don't trigger session expired on initial auth check — this is expected
    // when the user is not logged in. Only API calls during an active session
    // should trigger the handler.
    throw new Error("Session expired. Please log in again.");
  }
  const json: ApiResponse<PublicUser> = await res.json();
  if (!json.success) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data as PublicUser;
}

export function clearTokens(): void {
  localStorage.removeItem("labf_oidc_access_token");
  localStorage.removeItem("labf_oidc_refresh_token");
  localStorage.removeItem("labf_oidc_id_token");
  localStorage.removeItem("labf_oidc_hub_token");
  sessionStorage.removeItem("labf_oidc_code_verifier");
  sessionStorage.removeItem("labf_oidc_state");
}

// Prompts
export async function getPrompts(filters?: {
  genre?: PromptGenre;
  difficulty?: PromptDifficulty;
}): Promise<Prompt[]> {
  const params = new URLSearchParams();
  if (filters?.genre) params.set("genre", filters.genre);
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);
  const query = params.toString();
  return request<Prompt[]>(`/prompts${query ? `?${query}` : ""}`);
}

export async function getPrompt(id: string): Promise<Prompt> {
  return request<Prompt>(`/prompts/${id}`);
}

// Submissions
export async function createSubmission(data: {
  promptId?: string;
  content: string;
}): Promise<Submission & { revisions: Revision[] }> {
  return request(`/submissions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSubmissions(status?: string): Promise<Submission[]> {
  const query = status ? `?status=${status}` : "";
  return request<Submission[]>(`/submissions${query}`);
}

export async function getSubmission(
  id: string,
): Promise<Submission & { revisions: Revision[]; prompt?: Prompt }> {
  return request(`/submissions/${id}`);
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  await request<{ id: string }>(`/submissions/${submissionId}`, {
    method: "DELETE",
  });
}

export async function createRevision(
  submissionId: string,
  content: string,
): Promise<Revision> {
  return request<Revision>(`/submissions/${submissionId}/revisions`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function completeSubmission(
  submissionId: string,
): Promise<Submission> {
  return request<Submission>(`/submissions/${submissionId}/complete`, {
    method: "PATCH",
  });
}

// Coaching
export async function requestCoaching(
  submissionId: string,
): Promise<CoachingPass> {
  return request<CoachingPass>(`/submissions/${submissionId}/coach`, {
    method: "POST",
  });
}

export async function getCoachingSession(
  submissionId: string,
): Promise<CoachingSession> {
  return request<CoachingSession>(`/submissions/${submissionId}/coaching`);
}

export interface ApplySuggestionsResult {
  originalContent: string;
  improvedContent: string;
  mode: string;
  tokensUsed: number;
}

export async function applySuggestions(
  submissionId: string,
  content: string,
  feedback: string,
  mode: "grammar" | "vocabulary" | "improve" = "improve",
): Promise<ApplySuggestionsResult> {
  return request<ApplySuggestionsResult>(`/submissions/${submissionId}/apply`, {
    method: "POST",
    body: JSON.stringify({ content, feedback, mode }),
  });
}

// Category suggestions
export type RubricCategory =
  | "content"
  | "organization"
  | "vocabulary"
  | "grammar"
  | "spelling";

export interface CategorySuggestResult {
  category: RubricCategory;
  originalContent: string;
  improvedContent: string;
  tokensUsed: number;
}

export async function getCategorySuggestions(
  submissionId: string,
  content: string,
  category: RubricCategory,
): Promise<CategorySuggestResult> {
  return request<CategorySuggestResult>(
    `/submissions/${submissionId}/category-suggest`,
    {
      method: "POST",
      body: JSON.stringify({ content, category }),
    },
  );
}

// Scoring
export async function getScores(submissionId: string): Promise<RubricScores> {
  return request<RubricScores>(`/submissions/${submissionId}/scores`);
}

// Progress
export async function getProgress(days?: number): Promise<WritingProgress[]> {
  const query = days ? `?days=${days}` : "";
  return request<WritingProgress[]>(`/progress${query}`);
}

export async function getStreak(): Promise<{ streakDays: number }> {
  return request<{ streakDays: number }>("/progress/streak");
}
