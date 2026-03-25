import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PromptBrowser } from '../pages/PromptBrowser'
import * as api from '../services/api'
import { AuthProvider } from '../contexts/AuthContext'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

const mockPrompts = [
  {
    id: 'p1',
    title: 'The Hidden Door',
    body: 'You find a mysterious door in your garden...',
    genre: 'adventure' as const,
    difficulty: 'standard' as const,
    wordCountTarget: 300,
    tags: ['adventure'],
    createdAt: '2025-01-01',
  },
  {
    id: 'p2',
    title: 'Space Explorer',
    body: 'Your spaceship lands on an unknown planet...',
    genre: 'sci-fi' as const,
    difficulty: 'standard' as const,
    wordCountTarget: 400,
    tags: ['sci-fi'],
    createdAt: '2025-01-02',
  },
]

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.getMe.mockResolvedValue({
    id: '1',
    email: 'a@b.com',
    displayName: 'Alice',
    role: 'student',
    plan: 'free',
    createdAt: '2025-01-01',
  })
})

function renderBrowser() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PromptBrowser />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('PromptBrowser', () => {
  it('renders prompt cards', async () => {
    mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)

    renderBrowser()

    await waitFor(() => {
      expect(screen.getByText('The Hidden Door')).toBeInTheDocument()
      expect(screen.getByText('Space Explorer')).toBeInTheDocument()
    })
  })

  it('shows genre badges on cards', async () => {
    mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)

    renderBrowser()

    await waitFor(() => {
      expect(screen.getByText('adventure')).toBeInTheDocument()
      expect(screen.getByText('sci-fi')).toBeInTheDocument()
    })
  })

  it('filters by difficulty when tab clicked', async () => {
    mockedApi.getPrompts.mockResolvedValue([])
    const user = userEvent.setup()

    renderBrowser()

    await waitFor(() => {
      expect(mockedApi.getPrompts).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: 'standard' }),
      )
    })

    await user.click(screen.getByText('Challenge'))

    await waitFor(() => {
      expect(mockedApi.getPrompts).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: 'challenge' }),
      )
    })
  })

  it('shows empty state when no prompts', async () => {
    mockedApi.getPrompts.mockResolvedValueOnce([])

    renderBrowser()

    await waitFor(() => {
      expect(screen.getByText(/No prompts found/)).toBeInTheDocument()
    })
  })
})
