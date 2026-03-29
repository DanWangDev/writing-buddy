import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { AdminRoute } from '../components/AdminRoute'
import * as api from '../services/api'

vi.mock('../services/api')
const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.resetAllMocks()
})

function renderWithAdmin(initialEntry = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Content</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AdminRoute', () => {
  it('renders children when user is admin', async () => {
    mockedApi.getMe.mockResolvedValueOnce({
      id: '1',
      email: 'admin@test.com',
      displayName: 'Admin',
      role: 'admin',
      plan: 'pro',
      createdAt: '2025-01-01',
    })

    renderWithAdmin()

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })
  })

  it('shows "Not Authorized" for non-admin user', async () => {
    mockedApi.getMe.mockResolvedValueOnce({
      id: '2',
      email: 'student@test.com',
      displayName: 'Student',
      role: 'student',
      plan: 'free',
      createdAt: '2025-01-01',
    })

    renderWithAdmin()

    await waitFor(() => {
      expect(screen.getByText('Not Authorized')).toBeInTheDocument()
    })
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', async () => {
    mockedApi.getMe.mockRejectedValueOnce(new Error('no token'))

    renderWithAdmin()

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('shows loading spinner while checking auth', () => {
    mockedApi.getMe.mockReturnValueOnce(new Promise(() => {}))

    renderWithAdmin()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })
})
