import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WritingDesk } from '../pages/WritingDesk'
import * as api from '../services/api'
import { AuthProvider } from '../contexts/AuthContext'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

const mockUser = {
  id: '1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'student' as const,
  subscriptionPlan: 'free',
  createdAt: '2025-01-01',
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedApi.getMe.mockResolvedValue(mockUser)
})

function renderWritingDesk(path = '/write') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/write" element={<WritingDesk />} />
          <Route path="/write/:id" element={<WritingDesk />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('WritingDesk', () => {
  it('shows free writing header for new submission', async () => {
    renderWritingDesk()

    await waitFor(() => {
      expect(screen.getByText('Free Writing')).toBeInTheDocument()
    })
  })

  it('shows word count that updates as user types', async () => {
    const user = userEvent.setup()
    renderWritingDesk()

    const textarea = await screen.findByLabelText('Writing area')
    await user.type(textarea, 'Hello world today')

    expect(screen.getByText(/3 words/)).toBeInTheDocument()
  })

  it('save button is disabled when content is empty', async () => {
    renderWritingDesk()

    const saveBtn = await screen.findByText('Save')
    expect(saveBtn.closest('button')).toBeDisabled()
  })

  it('loads existing submission data', async () => {
    mockedApi.getSubmission.mockResolvedValueOnce({
      id: 'sub1',
      userId: '1',
      promptId: 'p1',
      currentRevision: 1,
      status: 'draft',
      wordCount: 50,
      startedAt: '2025-01-01',
      xpEarned: 0,
      revisions: [{ id: 'r1', submissionId: 'sub1', revisionNumber: 1, content: 'Once upon a time', wordCount: 4, createdAt: '2025-01-01' }],
      prompt: { id: 'p1', title: 'My Prompt', body: 'Write about it', genre: 'adventure', difficulty: 'standard', wordCountTarget: 300, tags: [], createdAt: '2025-01-01' },
    })
    mockedApi.getCoachingSession.mockRejectedValueOnce(new Error('none'))

    renderWritingDesk('/write/sub1')

    await waitFor(() => {
      expect(screen.getByText('My Prompt')).toBeInTheDocument()
    })

    const textarea = screen.getByLabelText('Writing area') as HTMLTextAreaElement
    expect(textarea.value).toBe('Once upon a time')
  })

  it('calls requestCoaching when Get Coaching clicked', async () => {
    const user = userEvent.setup()
    mockedApi.createSubmission.mockResolvedValueOnce({
      id: 'new-sub',
      userId: '1',
      currentRevision: 1,
      status: 'draft',
      wordCount: 5,
      startedAt: '2025-01-01',
      xpEarned: 0,
      revisions: [],
    })
    mockedApi.createRevision.mockResolvedValueOnce({
      id: 'r1',
      submissionId: 'new-sub',
      revisionNumber: 1,
      content: 'Some text here buddy',
      wordCount: 4,
      createdAt: '2025-01-01',
    })
    mockedApi.requestCoaching.mockResolvedValueOnce({
      id: 'cp1',
      submissionId: 'new-sub',
      revisionNumber: 1,
      passType: 'acknowledgment',
      feedback: 'Great start!',
      createdAt: '2025-01-01',
    })
    mockedApi.getSubmission.mockResolvedValueOnce({
      id: 'new-sub',
      userId: '1',
      currentRevision: 1,
      status: 'in_coaching',
      wordCount: 4,
      startedAt: '2025-01-01',
      xpEarned: 0,
      revisions: [{ id: 'r1', submissionId: 'new-sub', revisionNumber: 1, content: 'Some text here buddy', wordCount: 4, createdAt: '2025-01-01' }],
    })

    renderWritingDesk()

    const textarea = await screen.findByLabelText('Writing area')
    await user.type(textarea, 'Some text here buddy')

    // First save to create the submission
    await user.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(mockedApi.createSubmission).toHaveBeenCalled()
    })
  })

  it('shows coaching feedback in sidebar', async () => {
    mockedApi.getSubmission.mockResolvedValueOnce({
      id: 'sub1',
      userId: '1',
      currentRevision: 1,
      status: 'in_coaching',
      wordCount: 50,
      startedAt: '2025-01-01',
      xpEarned: 0,
      revisions: [{ id: 'r1', submissionId: 'sub1', revisionNumber: 1, content: 'My story', wordCount: 2, createdAt: '2025-01-01' }],
    })
    mockedApi.getCoachingSession.mockResolvedValueOnce({
      submissionId: 'sub1',
      currentPass: 1,
      passes: [
        { id: 'cp1', submissionId: 'sub1', revisionNumber: 1, passType: 'acknowledgment', feedback: 'Well done starting your story!', createdAt: '2025-01-01' },
      ],
      isComplete: false,
    })

    renderWritingDesk('/write/sub1')

    await waitFor(() => {
      expect(screen.getByText('Well done starting your story!')).toBeInTheDocument()
      expect(screen.getByText(/Pass 1: Acknowledgment/)).toBeInTheDocument()
    })
  })
})
