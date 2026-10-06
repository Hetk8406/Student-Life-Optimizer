import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export interface FeedbackContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useConfirm must be used within FeedbackProvider')
  return ctx.confirm
}

export function useToast() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useToast must be used within FeedbackProvider')
  return ctx.toast
}
