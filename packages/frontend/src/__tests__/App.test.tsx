import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { App } from '../App'

describe('App', () => {
  it('renders the dashboard with app title', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )

    expect(screen.getByText('Writing Buddy')).toBeInTheDocument()
    expect(screen.getByText(/creative writing coach/i)).toBeInTheDocument()
  })
})
