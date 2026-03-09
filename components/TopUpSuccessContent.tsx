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
          badgeClasses: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.08)]',
          iconPath: 'M5 13l4 4L19 7',
          accentClasses: 'from-emerald-500/20 via-emerald-400/5 to-transparent',
        }
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
      case 'REFUNDED':
        return {
          title: 'Payment Not Completed',
          description: status?.message || 'The payment was not completed. You can try again whenever you are ready.',
          badgeClasses: 'bg-rose-500/15 border-rose-400/35 text-rose-300 shadow-[0_0_0_1px_rgba(251,113,133,0.08)]',
          iconPath: 'M6 18L18 6M6 6l12 12',
          accentClasses: 'from-rose-500/20 via-rose-400/5 to-transparent',
        }
      default:
        return {
          title: 'Payment Pending',
          description:
            status?.message || 'Your payment is still processing. This page will update automatically.',
          badgeClasses: 'bg-amber-500/15 border-amber-400/35 text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]',
          iconPath: 'M12 8v4l3 3M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z',
          accentClasses: 'from-amber-500/20 via-amber-400/5 to-transparent',
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
    return (
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/75 p-8 text-center shadow-[0_30px_80px_rgba(2,6,23,0.85)] backdrop-blur-xl sm:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-50">Checking payment status</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
          We’re confirming your transaction with the payment provider. This usually takes a few seconds.
        </p>
        {referenceId ? (
          <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs text-slate-300">
            <span className="text-slate-400">Reference</span>
            <span className="truncate font-mono text-slate-100">{referenceId}</span>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/75 p-8 text-center shadow-[0_30px_80px_rgba(2,6,23,0.85)] backdrop-blur-xl sm:p-10">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${statusTone.accentClasses}`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/20 to-transparent" />

      <div className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${statusTone.badgeClasses}`}>
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={statusTone.iconPath} />
        </svg>
      </div>

      <div className="relative mt-6 space-y-3">
        <div className={`mx-auto inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${statusTone.badgeClasses}`}>
          {status?.state || 'PENDING'}
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-50">{statusTone.title}</h2>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-300 sm:text-base">{statusTone.description}</p>
      </div>

      <div className="relative mt-8 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 text-left shadow-inner shadow-black/10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Payment details</div>
            <div className="mt-1 text-sm text-slate-300">Live payment status for your top-up session.</div>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-500">Reference</span>
            <span className="max-w-[65%] break-all text-right font-mono text-xs text-slate-100">
              {status?.referenceId || referenceId || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Status</span>
            <span className="font-medium text-slate-100">{status?.state || 'PENDING'}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Tokens</span>
            <span className="font-medium text-slate-100">
              {typeof status?.tokens === 'number' ? status.tokens.toLocaleString('en-US') : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Charged</span>
            <span className="font-medium text-slate-100">
              {typeof status?.amount === 'number' && status?.currency
                ? `${status.amount.toFixed(2)} ${status.currency}`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {status?.state && !terminalStates.has(status.state) ? (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
          Auto-refreshing until the provider confirms your payment
        </div>
      ) : null}

      {error ? <p className="mt-5 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full border border-transparent bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition hover:bg-cyan-300"
        >
          View My Account
        </Link>
        {status?.receiptAvailable && status?.topupId ? (
          <Link
            href="/dashboard/receipts"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            View Receipt
          </Link>
        ) : null}
      </div>
    </div>
  )
}
