import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { StreakBadge } from './StreakBadge'
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  PenLine,
  LogOut,
  Settings,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import * as api from '../services/api'

const BASE_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/prompts', label: 'Browse Prompts', icon: BookOpen },
  { to: '/portfolio', label: 'My Writing', icon: FolderOpen },
  { to: '/write', label: 'Start Writing', icon: PenLine },
]

export function Layout() {
  const { user, logout } = useAuth()

  const NAV_ITEMS = user?.role === 'admin'
    ? [...BASE_NAV_ITEMS, { to: '/admin/prompts', label: 'Manage Prompts', icon: Settings }]
    : BASE_NAV_ITEMS
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
    <div className="min-h-screen bg-manga-page">
      {/* Top nav — bold blue manga bar */}
      <header className="bg-sky border-b-[3px] border-ink sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[10px] bg-gold border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,0.3)] -rotate-3">
                <PenLine className="w-5 h-5 text-ink" />
              </div>
              <span className="hidden sm:inline font-display text-xl text-white tracking-wider whitespace-nowrap" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.25)' }}>
                WRITING BUDDY
              </span>
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] text-xs font-bold whitespace-nowrap transition-colors border-2 ${
                      isActive
                        ? 'bg-gold text-ink border-ink shadow-[2px_2px_0_rgba(0,0,0,0.3)]'
                        : 'text-white border-transparent hover:bg-white/20 hover:border-white/30'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <StreakBadge streak={streak} />
            <span className="text-sm font-bold text-white hidden sm:inline">
              {user?.displayName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-white/70 hover:text-red-300 transition-colors rounded-lg hover:bg-white/10"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="lg:hidden p-2 text-white"
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
          <nav className="lg:hidden border-t-2 border-ink px-4 pb-3 pt-2 flex flex-col gap-1 bg-sky">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-3 rounded-[8px] text-sm font-bold border-2 ${
                    isActive
                      ? 'bg-gold text-ink border-ink shadow-[2px_2px_0_rgba(0,0,0,0.3)]'
                      : 'text-white border-transparent hover:bg-white/20'
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
