export type ToastVariant = 'success' | 'error' | 'info'

let addToastGlobal: ((text: string, variant: ToastVariant) => void) | null = null

export function toast(text: string, variant: ToastVariant = 'info') {
  addToastGlobal?.(text, variant)
}

export function setToastHandler(handler: ((text: string, variant: ToastVariant) => void) | null) {
  addToastGlobal = handler
}
