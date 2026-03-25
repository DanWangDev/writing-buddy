import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from '../pages/Dashboard'
import * as api from '../services/api'
import { AuthProvider } from '../contexts/AuthContext'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

const mockUser = {
  id: '1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'student' as const,
  plan: 'free',
  createdAt: '2025-01-01',
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.getMe.mockResolvedValue(mockUser)
})

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  it('renders welcome message with user name', async () => {
    mockedApi.getStreak.mockResolvedValueOnce({ streakDays: 3 })
    mockedApi.getProgress.mockResolvedValueOnce([])
    mockedApi.getSubmissions.mockResolvedValueOnce([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Alice/)).toBeInTheDocument()
    })
  })

  it('renders XP and word stats', async () => {
    mockedApi.getStreak.mockResolvedValueOnce({ streakDays: 5 })
    mockedApi.getProgress.mockResolvedValueOnce([
      {
        id: 'p1',
        userId: '1',
        date: '2025-01-01',
        submissionsCount: 1,
        revisionsCount: 2,
        wordsWritten: 500,
        coachingSessions: 1,
        xpEarned: 42,
        streakDays: 5,
      },
    ])
    mockedApi.getSubmissions.mockResolvedValueOnce([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
    })
  })

  it('renders recent submissions', async () => {
    mockedApi.getStreak.mockResolvedValueOnce({ streakDays: 0 })
    mockedApi.getProgress.mockResolvedValueOnce([])
    mockedApi.getSubmissions.mockResolvedValueOnce([
      {
        id: 'sub-12345678-extra',
        userId: '1',
        currentRevision: 1,
        status: 'draft',
        wordCount: 120,
        startedAt: '2025-01-15T10:00:00Z',
        xpEarned: 10,
      },
    ])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Free Writing #sub-1234')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  it('shows empty state when no submissions', async () => {
    mockedApi.getStreak.mockResolvedValueOnce({ streakDays: 0 })
    mockedApi.getProgress.mockResolvedValueOnce([])
    mockedApi.getSubmissions.mockResolvedValueOnce([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/Inkwell is waiting/)).toBeInTheDocument()
    })
  })
})
