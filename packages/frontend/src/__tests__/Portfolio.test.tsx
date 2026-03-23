import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Portfolio } from '../pages/Portfolio'
import * as api from '../services/api'
import { AuthProvider } from '../contexts/AuthContext'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.getMe.mockResolvedValue({
    id: '1',
    email: 'a@b.com',
    displayName: 'Alice',
    role: 'student',
    subscriptionPlan: 'free',
    createdAt: '2025-01-01',
  })
})

function renderPortfolio() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Portfolio />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Portfolio', () => {
  it('renders list of submissions', async () => {
    mockedApi.getSubmissions.mockResolvedValueOnce([
      {
        id: 'sub-aaaabbbb',
        userId: '1',
        currentRevision: 2,
        status: 'completed',
        wordCount: 250,
        startedAt: '2025-01-10T10:00:00Z',
        completedAt: '2025-01-10T12:00:00Z',
        xpEarned: 50,
      },
      {
        id: 'sub-ccccdddd',
        userId: '1',
        currentRevision: 1,
        status: 'draft',
        wordCount: 80,
        startedAt: '2025-01-12T10:00:00Z',
        xpEarned: 5,
      },
    ])

    renderPortfolio()

    await waitFor(() => {
      expect(screen.getByText('Submission #sub-aaaa')).toBeInTheDocument()
      expect(screen.getByText('Submission #sub-cccc')).toBeInTheDocument()
    })
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('shows empty state when no submissions', async () => {
    mockedApi.getSubmissions.mockResolvedValueOnce([])

    renderPortfolio()

    await waitFor(() => {
      expect(screen.getByText(/No writing yet/)).toBeInTheDocument()
    })
  })

  it('shows XP earned for each submission', async () => {
    mockedApi.getSubmissions.mockResolvedValueOnce([
      {
        id: 'sub-11112222',
        userId: '1',
        currentRevision: 1,
        status: 'completed',
        wordCount: 200,
        startedAt: '2025-01-01T10:00:00Z',
        xpEarned: 75,
      },
    ])

    renderPortfolio()

    await waitFor(() => {
      expect(screen.getByText(/75 XP/)).toBeInTheDocument()
    })
  })
})
