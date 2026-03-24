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
        className="relative bg-white rounded-[16px] border border-warm-200 shadow-lg w-full max-w-sm p-6 space-y-4"
      >
        <h2
          id="confirm-title"
          className="font-display text-xl font-bold text-warm-800"
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
            className="flex-1 h-12 text-base font-semibold rounded-[10px] bg-sky text-white hover:bg-sky-dark transition-colors shadow-sm shadow-sky/20"
          >
            {cancelLabel}
          </button>

          {/* Confirm (muted — destructive action) */}
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-12 text-base font-semibold rounded-[10px] border-2 transition-colors ${
              variant === 'danger'
                ? 'border-red-200 text-red-500 bg-white hover:bg-red-50'
                : 'border-warm-200 text-warm-600 bg-white hover:bg-warm-50'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
