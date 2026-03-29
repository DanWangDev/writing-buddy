import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { StreakBadge } from './StreakBadge'
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  PenLine,
  LogOut,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import * as api from '../services/api'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/prompts', label: 'Browse Prompts', icon: BookOpen },
  { to: '/portfolio', label: 'My Writing', icon: FolderOpen },
  { to: '/write', label: 'Start Writing', icon: PenLine },
]

export function Layout() {
  const { user, logout } = useAuth()
  const [streak, setStreak] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    api
      .getStreak()
      .then((data) => setStreak(data.streakDays))
      .catch(() => setStreak(0))
  }, [])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Top nav */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-warm-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-sky flex items-center justify-center">
                <PenLine className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline font-display font-bold text-xl text-warm-800">
                Writing Buddy
              </span>
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-sky/10 text-sky'
                        : 'text-warm-500 hover:bg-warm-100 hover:text-warm-700'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <StreakBadge streak={streak} />
            <span className="text-sm font-semibold text-warm-700 hidden sm:inline">
              {user?.displayName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-warm-400 hover:text-red-500 transition-colors rounded-lg hover:bg-warm-100"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="md:hidden p-2 text-warm-500"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-warm-200 px-4 pb-3 pt-2 flex flex-col gap-1 bg-white">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-3 rounded-[10px] text-sm font-semibold ${
                    isActive
                      ? 'bg-sky/10 text-sky'
                      : 'text-warm-500 hover:bg-warm-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
