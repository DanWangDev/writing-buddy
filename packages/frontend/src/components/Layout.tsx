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
  X,
  Menu,
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
    <div className="min-h-screen bg-manga-page flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-sky border-r-[3px] border-ink sticky top-0 h-screen z-30">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 px-4 py-5 border-b-2 border-ink/30">
          <div className="w-10 h-10 rounded-[10px] bg-gold border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,0.3)] -rotate-3">
            <PenLine className="w-5 h-5 text-ink" />
          </div>
          <span className="font-display text-xl text-white tracking-wider" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.25)' }}>
            WRITING BUDDY
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-3 rounded-[10px] text-sm font-bold transition-all border-2 ${
                  isActive
                    ? 'bg-gold text-ink border-ink shadow-[3px_3px_0_rgba(0,0,0,0.3)]'
                    : 'text-white border-transparent hover:bg-white/15 hover:border-white/20'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="px-3 py-4 border-t-2 border-ink/30 space-y-3">
          <StreakBadge streak={streak} />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white truncate">
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
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-sky border-b-[3px] border-ink z-30">
        <div className="px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-gold border-2 border-ink flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,0.3)] -rotate-3">
              <PenLine className="w-4 h-4 text-ink" />
            </div>
            <span className="font-display text-lg text-white tracking-wider" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.25)' }}>
              WRITING BUDDY
            </span>
          </NavLink>

          <div className="flex items-center gap-2">
            <StreakBadge streak={streak} />
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="p-2 text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileOpen && (
          <nav className="border-t-2 border-ink px-4 pb-3 pt-2 flex flex-col gap-1 bg-sky">
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
            <div className="flex items-center justify-between px-3 pt-2 border-t border-white/20 mt-1">
              <span className="text-sm font-bold text-white">{user?.displayName}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-white/70 hover:text-red-300 transition-colors rounded-lg"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:max-w-6xl px-4 py-6 md:py-8 md:px-8 mt-14 md:mt-0">
        <Outlet />
      </main>
    </div>
  )
}
