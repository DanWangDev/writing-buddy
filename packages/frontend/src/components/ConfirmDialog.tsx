import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No, keep it!',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-warm-900/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative bg-white rounded-[16px] border-3 border-ink shadow-[6px_6px_0_var(--color-ink)] w-full max-w-sm p-6 space-y-4"
      >
        <h2
          id="confirm-title"
          className="font-display text-xl text-warm-800 tracking-wider uppercase"
        >
          {title}
        </h2>
        <p id="confirm-message" className="text-base text-warm-600 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 pt-2">
          {/* Cancel (highlighted / primary — safe action) */}
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="btn-manga flex-1 h-12 text-base bg-sky text-white"
          >
            {cancelLabel}
          </button>

          {/* Confirm (muted — destructive action) */}
          <button
            type="button"
            onClick={onConfirm}
            className={`btn-manga flex-1 h-12 text-base ${
              variant === 'danger'
                ? 'bg-white text-red-500'
                : 'bg-white text-warm-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
