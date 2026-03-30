import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { StreakBadge } from './StreakBadge'
import { LogOut, ExternalLink } from 'lucide-react'

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:3009'

interface UserMenuProps {
  streak: number
  collapsed?: boolean
}

export function UserMenu({ streak, collapsed = false }: UserMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  if (!user) return null

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger: avatar + name */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center w-full rounded-[10px] transition-colors hover:bg-white/15 ${
          collapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-2'
        }`}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-gold border-2 border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
          <span className="text-xs font-bold text-ink leading-none">{initials}</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-white truncate">{user.displayName}</span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className={`absolute z-50 bg-white border-3 border-ink rounded-[12px] shadow-[4px_4px_0_var(--color-ink)] ${
            collapsed ? 'left-[calc(100%+8px)] bottom-0' : 'bottom-[calc(100%+8px)] left-0 right-0'
          }`}
          style={{ minWidth: '200px' }}
          role="menu"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b-2 border-warm-100">
            <p className="font-bold text-warm-800 text-sm truncate">{user.displayName}</p>
            <p className="text-xs text-warm-400 truncate">{user.email}</p>
            <div className="mt-2">
              <StreakBadge streak={streak} />
            </div>
          </div>

          {/* Actions */}
          <div className="py-1.5">
            <a
              href={HUB_URL}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-warm-700 hover:bg-sky/10 hover:text-sky transition-colors cursor-pointer"
              role="menuitem"
            >
              <ExternalLink className="w-4 h-4" />
              Back to 11+ Hub
            </a>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-bold text-warm-700 hover:bg-red-50 hover:text-red-500 transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Inline version for mobile nav — no popover, just links.
 */
export function UserMenuInline({ streak }: { streak: number }) {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="px-3 pt-2 border-t border-white/20 mt-1 space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-white">{user.displayName}</span>
        <StreakBadge streak={streak} />
      </div>
      <a
        href={HUB_URL}
        className="flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-sm font-bold text-white hover:bg-white/20 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Back to 11+ Hub
      </a>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[8px] text-sm font-bold text-white/70 hover:text-red-300 hover:bg-white/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Log out
      </button>
    </div>
  )
}
