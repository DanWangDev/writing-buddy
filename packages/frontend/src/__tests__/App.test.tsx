import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import * as api from '../services/api'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

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

  it('renders callback page at /auth/callback', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))

    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <App />
      </MemoryRouter>,
    )

    // Callback page shows error (no code parameter in test URL)
    expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
  })
})
