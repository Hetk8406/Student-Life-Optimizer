import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { FeedbackContext } from './FeedbackContext'
import type { ConfirmOptions, ToastItem } from './FeedbackContext'

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  // open confirmation dialog and return promise
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        resolve,
      })
    })
  }, [])

  // toast helper methods
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 5)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: useCallback((message: string) => addToast(message, 'success'), [addToast]),
    error: useCallback((message: string) => addToast(message, 'error'), [addToast]),
    info: useCallback((message: string) => addToast(message, 'info'), [addToast]),
  }

  // close confirm dialog
  const handleClose = useCallback(
    (result: boolean) => {
      if (!confirmState) return
      confirmState.resolve(result)
      setConfirmState(null)
    },
    [confirmState]
  )

  // focus cancel button when dialog opens and handle escape key
  useEffect(() => {
    if (!confirmState) return

    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus()
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [confirmState, handleClose])

  return (
    <FeedbackContext.Provider value={{ confirm, toast }}>
      {children}

      {/* CONFIRM DIALOG MODAL */}
      {confirmState && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose(false)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full">
            {confirmState.isDestructive ? (
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {confirmState.title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {confirmState.message}
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm ${
                  confirmState.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white'
                }`}
              >
                {confirmState.isDestructive && <Trash2 className="w-4 h-4" />}
                {confirmState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
              t.type === 'error'
                ? 'border-rose-200 dark:border-rose-800/60'
                : 'border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="truncate">{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 shrink-0"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}
