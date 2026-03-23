import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../contexts/AuthContext'
import { useAuth } from '../hooks/useAuth'
import * as api from '../services/api'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="name">{user?.displayName ?? 'none'}</span>
      <button onClick={() => login('a@b.com', 'pass')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

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
})

describe('AuthContext', () => {
  it('shows loading then unauthenticated when getMe fails', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('authed').textContent).toBe('false')
    expect(screen.getByTestId('name').textContent).toBe('none')
  })

  it('restores session when getMe succeeds', async () => {
    mockedApi.getMe.mockResolvedValueOnce(mockUser)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Alice')
    })
    expect(screen.getByTestId('authed').textContent).toBe('true')
  })

  it('login sets user', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))
    mockedApi.login.mockResolvedValueOnce(mockUser)
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Alice')
    })
  })

  it('logout clears user', async () => {
    mockedApi.getMe.mockResolvedValueOnce(mockUser)
    mockedApi.logout.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Alice')
    })

    await user.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(screen.getByTestId('authed').textContent).toBe('false')
    })
  })
})
