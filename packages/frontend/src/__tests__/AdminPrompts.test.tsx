import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AdminPrompts } from '../pages/AdminPrompts'
import { AuthProvider } from '../contexts/AuthContext'
import * as api from '../services/api'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

const mockPrompts = [
  {
    id: 'p1',
    title: 'Adventure Quest',
    body: 'You discover a hidden cave behind a waterfall...',
    genre: 'adventure' as const,
    difficulty: 'beginner' as const,
    wordCountTarget: 200,
    tags: ['explore', 'nature'],
    createdAt: '2025-01-01',
  },
  {
    id: 'p2',
    title: 'Mystery Manor',
    body: 'The old house at the end of the street holds a secret...',
    genre: 'mystery' as const,
    difficulty: 'standard' as const,
    tags: ['clue', 'detective'],
    createdAt: '2025-01-02',
  },
]

const mockStats = {
  heatmap: [
    { genre: 'adventure', difficulty: 'beginner', count: 1 },
    { genre: 'mystery', difficulty: 'standard', count: 1 },
    { genre: 'fantasy', difficulty: 'challenge', count: 0 },
  ],
  submissionCounts: { p1: 5, p2: 12 },
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.getMe.mockResolvedValue({
    id: '1',
    email: 'admin@test.com',
    displayName: 'Admin',
    role: 'admin',
    plan: 'pro',
    createdAt: '2025-01-01',
  })
})

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminPrompts />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AdminPrompts', () => {
  describe('List view', () => {
    it('renders prompts with title and count badge', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
        expect(screen.getByText('Mystery Manor')).toBeInTheDocument()
      })
      expect(screen.getByText('Manage Prompts')).toBeInTheDocument()
      // Count badge
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows submission count badges', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('5 submissions')).toBeInTheDocument()
        expect(screen.getByText('12 submissions')).toBeInTheDocument()
      })
    })

    it('shows empty state when no prompts', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce([])
      mockedApi.getPromptStats.mockResolvedValueOnce({ heatmap: [], submissionCounts: {} })

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('No prompts found.')).toBeInTheDocument()
        expect(screen.getByText('Create your first prompt')).toBeInTheDocument()
      })
    })

    it('shows error state with retry button', async () => {
      mockedApi.getPrompts.mockRejectedValueOnce(new Error('Network error'))
      mockedApi.getPromptStats.mockRejectedValueOnce(new Error('Network error'))

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('retries fetch on Retry click', async () => {
      mockedApi.getPrompts.mockRejectedValueOnce(new Error('Network error'))
      mockedApi.getPromptStats.mockRejectedValueOnce(new Error('Network error'))

      renderAdmin()
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)

      await user.click(screen.getByText('Retry'))

      await waitFor(() => {
        expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
      })
    })
  })

  describe('Heatmap', () => {
    it('renders heatmap with correct cell values', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Content Coverage')).toBeInTheDocument()
      })

      // Verify a cell has the correct aria-label
      expect(screen.getByLabelText('adventure beginner: 1 prompts')).toBeInTheDocument()
      expect(screen.getByLabelText('mystery standard: 1 prompts')).toBeInTheDocument()
    })

    it('filters prompts when heatmap cell clicked', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
      })

      // Click adventure/beginner cell — should filter to just p1
      await user.click(screen.getByLabelText('adventure beginner: 1 prompts'))

      // Mystery prompt should be hidden
      expect(screen.queryByText('Mystery Manor')).not.toBeInTheDocument()
      expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
    })

    it('toggles filter off when same cell clicked again', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
      })

      const cell = screen.getByLabelText('adventure beginner: 1 prompts')
      await user.click(cell)
      expect(screen.queryByText('Mystery Manor')).not.toBeInTheDocument()

      await user.click(cell)
      expect(screen.getByText('Mystery Manor')).toBeInTheDocument()
    })
  })

  describe('Create form', () => {
    it('switches to create view on "Add Prompt" click', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Add Prompt')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Prompt'))

      expect(screen.getByText('New Prompt')).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Body')).toBeInTheDocument()
    })

    it('shows validation errors for empty form submission', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce([])
      mockedApi.getPromptStats.mockResolvedValueOnce({ heatmap: [], submissionCounts: {} })
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Create your first prompt')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Create your first prompt'))

      // Submit empty form
      await user.click(screen.getByText('Save Prompt'))

      await waitFor(() => {
        expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument()
        expect(screen.getByText('Body must be at least 20 characters')).toBeInTheDocument()
        expect(screen.getByText('At least one tag is required')).toBeInTheDocument()
      })
    })

    it('submits form successfully and returns to list', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce([])
      mockedApi.getPromptStats.mockResolvedValueOnce({ heatmap: [], submissionCounts: {} })
      mockedApi.createPromptAdmin.mockResolvedValueOnce({
        id: 'new-1',
        title: 'New Title',
        body: 'A sufficiently long body for validation to pass here.',
        genre: 'adventure',
        difficulty: 'standard',
        tags: ['test'],
        createdAt: '2025-01-01',
      })
      // After success, fetchData is called again
      mockedApi.getPrompts.mockResolvedValueOnce([])
      mockedApi.getPromptStats.mockResolvedValueOnce({ heatmap: [], submissionCounts: {} })

      const user = userEvent.setup()
      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Create your first prompt')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Create your first prompt'))

      await user.type(screen.getByLabelText('Title'), 'New Title')
      await user.type(screen.getByLabelText('Body'), 'A sufficiently long body for validation to pass here.')
      await user.type(screen.getByLabelText('Tags (comma-separated)'), 'test')

      await user.click(screen.getByText('Save Prompt'))

      await waitFor(() => {
        expect(mockedApi.createPromptAdmin).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Title',
            tags: ['test'],
          }),
        )
      })

      // Should return to list view
      await waitFor(() => {
        expect(screen.getByText('Manage Prompts')).toBeInTheDocument()
      })
    })

    it('shows live preview as form is filled', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Add Prompt')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Add Prompt'))

      // Initially shows placeholder
      expect(screen.getByText('Start typing to preview')).toBeInTheDocument()

      // Type a title
      await user.type(screen.getByLabelText('Title'), 'My Preview Title')

      // Live preview should show the title
      expect(screen.getByText('Live Preview')).toBeInTheDocument()
      expect(screen.queryByText('Start typing to preview')).not.toBeInTheDocument()
    })

    it('cancels back to list view', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Add Prompt')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Add Prompt'))

      expect(screen.getByText('New Prompt')).toBeInTheDocument()

      await user.click(screen.getByText('Cancel'))

      expect(screen.getByText('Manage Prompts')).toBeInTheDocument()
    })
  })

  describe('Edit form', () => {
    it('switches to edit view with pre-filled data', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('Edit Adventure Quest'))

      expect(screen.getByText('Edit: Adventure Quest')).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toHaveValue('Adventure Quest')
    })
  })

  describe('Delete flow', () => {
    it('shows confirm dialog and archives on confirm', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      mockedApi.deletePrompt.mockResolvedValueOnce(undefined)
      // After delete, fetchData is called again
      mockedApi.getPrompts.mockResolvedValueOnce([mockPrompts[1]])
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)

      const user = userEvent.setup()
      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('Archive Adventure Quest'))

      // Confirm dialog should appear
      expect(screen.getByText('Archive this prompt?')).toBeInTheDocument()

      await user.click(screen.getByText('Archive'))

      await waitFor(() => {
        expect(mockedApi.deletePrompt).toHaveBeenCalledWith('p1')
      })
    })

    it('cancels delete dialog', async () => {
      mockedApi.getPrompts.mockResolvedValueOnce(mockPrompts)
      mockedApi.getPromptStats.mockResolvedValueOnce(mockStats)
      const user = userEvent.setup()

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText('Adventure Quest')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('Archive Adventure Quest'))
      expect(screen.getByText('Archive this prompt?')).toBeInTheDocument()

      await user.click(screen.getByText('Keep it'))

      expect(screen.queryByText('Archive this prompt?')).not.toBeInTheDocument()
    })
  })
})
