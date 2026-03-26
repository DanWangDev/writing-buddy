import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import * as api from '../services/api'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

beforeEach(() => {
  // Layout calls getStreak on mount — provide a safe default
  mockedApi.getStreak.mockResolvedValue({ streakDays: 0 })
})

describe('App', () => {
  it('redirects unauthenticated users to login', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Welcome to Writing Buddy!')).toBeInTheDocument()
    })
  })

  it('renders login page at /login', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Welcome to Writing Buddy!')).toBeInTheDocument()
    expect(screen.getByText(/Sign in with your 11\+ Hub account/)).toBeInTheDocument()
  })

  it('shows dashboard when authenticated', async () => {
    mockedApi.getMe.mockResolvedValueOnce({
      id: '1',
      email: 'a@b.com',
      displayName: 'Test',
      role: 'student',
      plan: 'free',
      createdAt: '2025-01-01',
    })
    // Layout calls getStreak on mount
    mockedApi.getStreak.mockResolvedValueOnce({ streakDays: 3 })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Welcome to Writing Buddy!')).not.toBeInTheDocument()
    })
  })
})
