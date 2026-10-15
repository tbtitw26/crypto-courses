'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'

type ToastVariant = 'default' | 'success' | 'error' | 'info'

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastRecord extends Required<Omit<ToastInput, 'duration'>> {
  id: string
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-slate-800 bg-slate-900/95 text-slate-50',
  success: 'border-emerald-500/40 bg-slate-900/95 text-emerald-300',
  error: 'border-rose-500/40 bg-slate-900/95 text-rose-300',
  info: 'border-cyan-500/40 bg-slate-900/95 text-cyan-300',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const tUi = useTranslations('common.ui')
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Only render portal on client side after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    ({ title, description, variant = 'default', duration = 4500 }: ToastInput) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
      const toast: ToastRecord = {
        id,
        title,
        description: description ?? '',
        variant,
      }
      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration)
        timers.current.set(id, timer)
      }
    },
    [removeToast]
  )

  const contextValue = useMemo(
    () => ({
      showToast,
      dismissToast: removeToast,
    }),
    [removeToast, showToast]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {isMounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-x-0 top-4 z-[1200] flex flex-col items-center gap-3 px-4 pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`${variantStyles[toast.variant]} pointer-events-auto w-full max-w-md rounded-2xl border p-4 shadow-lg shadow-black/5 backdrop-blur`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description && <p className="text-sm text-slate-300">{toast.description}</p>}
                  </div>
                  <button
                    aria-label={tUi('dismiss')}
                    onClick={() => removeToast(toast.id)}
                    className="rounded-full p-1 text-sm text-current transition hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider')
  }
  return context
}



