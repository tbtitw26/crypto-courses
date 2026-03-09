// components/TopUpSuccessContent.tsx - Top-up success content

'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'

type TopupStatus = 'INITIATED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED'

type StatusResponse = {
  found: boolean
  referenceId?: string
  state?: TopupStatus
  amount?: number
  currency?: string
  tokens?: number
  topupId?: number | null
  receiptAvailable?: boolean
  message?: string
}

const terminalStates = new Set<TopupStatus>(['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED'])

export default function TopUpSuccessContent() {
  const searchParams = useSearchParams()
  const { update } = useSession()
  const { clearCart } = useCart()
  const referenceId = searchParams.get('reference')
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasAppliedSuccessSideEffects = useRef(false)

  const statusTone = useMemo(() => {
    switch (status?.state) {
      case 'COMPLETED':
        return {
          title: 'Payment Successful!',
          description:
            status.message || 'Your payment has been confirmed and the tokens were added to your account.',
          badgeClasses: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
          iconPath: 'M5 13l4 4L19 7',
        }
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
      case 'REFUNDED':
        return {
          title: 'Payment Not Completed',
          description: status?.message || 'The payment was not completed. You can try again whenever you are ready.',
          badgeClasses: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
          iconPath: 'M6 18L18 6M6 6l12 12',
        }
      default:
        return {
          title: 'Payment Pending',
          description:
            status?.message || 'Your payment is being processed. This page updates automatically while we wait for the provider callback.',
          badgeClasses: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
          iconPath: 'M12 8v4l3 3M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z',
        }
    }
  }, [status])

  useEffect(() => {
    if (!referenceId) {
      setError('Missing payment reference. Please check your dashboard for updates.')
      setIsLoading(false)
      return
    }

    let isCancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      try {
        const response = await fetch(`/api/topup/status?reference=${encodeURIComponent(referenceId)}`, {
          cache: 'no-store',
        })
        const data = (await response.json().catch(() => null)) as StatusResponse | null

        if (isCancelled) return

        if (!response.ok || !data) {
          throw new Error(data?.message || 'Unable to fetch payment status')
        }

        setStatus(data)
        setError(null)
        setIsLoading(false)

        if (data.state === 'COMPLETED' && !hasAppliedSuccessSideEffects.current) {
          hasAppliedSuccessSideEffects.current = true
          clearCart()
          await update()
        }

        if (data.state && !terminalStates.has(data.state)) {
          timer = setTimeout(poll, 3000)
        }
      } catch (err: any) {
        if (isCancelled) return
        setError(err.message || 'Unable to fetch payment status')
        setIsLoading(false)
        timer = setTimeout(poll, 5000)
      }
    }

    void poll()

    return () => {
      isCancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [clearCart, referenceId, update])

  if (isLoading) {
    return <div className="text-center text-slate-300">Checking your payment status…</div>
  }

  return (
    <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg p-8 text-center">
      <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full border ${statusTone.badgeClasses}`}>
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={statusTone.iconPath} />
        </svg>
      </div>

      <h2 className="mt-4 text-2xl font-bold text-slate-50">{statusTone.title}</h2>
      <p className="mt-2 text-slate-300">{statusTone.description}</p>

      {status?.tokens ? (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-left text-sm text-slate-300 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Reference</span>
            <span className="font-mono text-xs text-slate-200">{status.referenceId}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Tokens</span>
            <span className="text-slate-100">{status.tokens.toLocaleString('en-US')}</span>
          </div>
          {status.amount && status.currency && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Charged</span>
              <span className="text-slate-100">{status.amount.toFixed(2)} {status.currency}</span>
            </div>
          )}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-[0_14px_32px_rgba(8,145,178,0.65)] text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition"
        >
          View My Account
        </Link>
        {status?.receiptAvailable && status?.topupId ? (
          <Link
            href={`/dashboard/receipts`}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-700 rounded-full text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
          >
            View Receipt
          </Link>
        ) : null}
      </div>
    </div>
  )
}
