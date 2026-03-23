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
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    })
  })

  it('renders login page at /login', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    expect(screen.getByText(/Sign in to continue/)).toBeInTheDocument()
  })

  it('renders register page at /register', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))

    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Join Writing Buddy!')).toBeInTheDocument()
  })
})
