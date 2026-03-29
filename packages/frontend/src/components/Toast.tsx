import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import type { ToastVariant } from './toast-store'
import { setToastHandler } from './toast-store'

interface ToastMessage {
  id: number
  text: string
  variant: ToastVariant
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: typeof CheckCircle2 }> = {
  success: { bg: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2 },
  error: { bg: 'bg-red-50 border-red-200 text-red-800', icon: XCircle },
  info: { bg: 'bg-sky/5 border-sky/20 text-sky-dark', icon: Info },
}

let toastId = 0

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    setToastHandler((text: string, variant: ToastVariant) => {
      const id = ++toastId
      setToasts(prev => [...prev, { id, text, variant }])
    })
    return () => { setToastHandler(null) }
  }, [])

  const dismiss = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>,
    document.body
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false)
  const style = VARIANT_STYLES[t.variant]
  const Icon = style.icon

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => onDismiss(t.id), 3000)
    return () => clearTimeout(timer)
  }, [t.id, onDismiss])

  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-[10px] border shadow-sm ${style.bg} ${
        prefersReduced ? '' : `transition-all duration-200 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium flex-1">{t.text}</span>
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        className="p-1 rounded hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
