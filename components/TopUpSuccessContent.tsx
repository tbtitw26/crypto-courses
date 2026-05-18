// components/TopUpSuccessContent.tsx - Payment status center

'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ReceiptText,
  ShoppingCart,
  XCircle,
} from 'lucide-react'

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

function isHostedTopupCartItem(slug: string): boolean {
  return slug.startsWith('token-pack-') || slug.startsWith('custom-top-up')
}

export default function TopUpSuccessContent() {
  const searchParams = useSearchParams()
  const { update } = useSession()
  const { items, clearCart } = useCart()
  const referenceId = searchParams.get('reference')
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasAppliedSuccessSideEffects = useRef(false)

  const hasCourseItemsInCart = useMemo(
    () => items.some((item) => !isHostedTopupCartItem(item.slug)),
    [items]
  )
  const hasOnlyHostedTopupItems = useMemo(
    () => items.length > 0 && items.every((item) => isHostedTopupCartItem(item.slug)),
    [items]
  )

  const statusConfig = useMemo(() => {
    switch (status?.state) {
      case 'COMPLETED':
        return {
          title: 'Payment Successful!',
          description:
            status.message || 'Your payment has been confirmed and the tokens were added to your account.',
          icon: CheckCircle2,
          iconBg: 'border-emerald-200 bg-emerald-50',
          iconColor: 'text-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          tone: 'success' as const,
        }
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
      case 'REFUNDED':
        return {
          title: 'Payment Not Completed',
          description: status?.message || 'The payment was not completed. You can try again whenever you are ready.',
          icon: XCircle,
          iconBg: 'border-rose-200 bg-rose-50',
          iconColor: 'text-rose-600',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          tone: 'error' as const,
        }
      default:
        return {
          title: 'Payment Pending',
          description:
            status?.message || 'Your payment is still processing. This page will update automatically.',
          icon: Clock,
          iconBg: 'border-gold-200 bg-gold-50',
          iconColor: 'text-gold-600',
          badgeBg: 'bg-gold-50 text-gold-700 border-gold-200',
          tone: 'pending' as const,
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
          await update()

          if (hasOnlyHostedTopupItems) {
            clearCart()
          }
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
  }, [clearCart, hasOnlyHostedTopupItems, referenceId, update])

  const StatusIcon = statusConfig.icon

  // ─── LOADING STATE ───
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-xl border border-surface-300 bg-white p-8 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-300 bg-surface-100">
            <Loader2 className="h-6 w-6 animate-spin text-brand-700" />
          </div>
          <h2 className="mt-5 font-heading text-xl font-semibold text-text-main">
            Checking payment status
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
            Confirming your transaction with the payment provider. This usually takes a few seconds.
          </p>
          {referenceId && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-100 px-3 py-1.5 text-sm">
              <span className="text-text-muted">Reference</span>
              <span className="truncate font-mono text-text-main">{referenceId}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── STATUS RESULT ───
  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      {/* Status card */}
      <div className="rounded-xl border border-surface-300 bg-white shadow-card">
        <div className="px-6 py-8 text-center sm:px-8 sm:py-10">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${statusConfig.iconBg}`}
          >
            <StatusIcon className={`h-7 w-7 ${statusConfig.iconColor}`} />
          </div>

          <div className="mt-5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${statusConfig.badgeBg}`}
            >
              {status?.state || 'PENDING'}
            </span>
          </div>

          <h2 className="mt-3 font-heading text-2xl font-semibold text-text-main">
            {statusConfig.title}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
            {statusConfig.description}
          </p>
        </div>

        {/* Payment details */}
        <div className="border-t border-surface-200 px-6 py-5 sm:px-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
            Payment details
          </p>

          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">Reference</dt>
              <dd className="max-w-[60%] truncate text-right font-mono text-sm font-medium text-text-main">
                {status?.referenceId || referenceId || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">Status</dt>
              <dd className="font-medium text-text-main">{status?.state || 'PENDING'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">Tokens</dt>
              <dd className="font-medium text-text-main">
                {typeof status?.tokens === 'number' ? status.tokens.toLocaleString('en-US') : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">Charged</dt>
              <dd className="font-medium text-text-main">
                {typeof status?.amount === 'number' && status?.currency
                  ? `${status.amount.toFixed(2)} ${status.currency}`
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Polling indicator */}
      {status?.state && !terminalStates.has(status.state) && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-sm font-medium text-gold-800">
          <span className="h-2 w-2 animate-pulse rounded-full bg-gold-500" />
          Auto-refreshing until the provider confirms your payment
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Course continuation notice */}
      {status?.state === 'COMPLETED' && hasCourseItemsInCart && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
          <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          <div>
            <p className="text-sm font-medium text-brand-800">
              Your balance has been updated. Return to checkout to finish the course purchase with tokens.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-2.5">
          {status?.state === 'COMPLETED' && hasCourseItemsInCart ? (
            <Link href="/checkout" className="btn-primary flex w-full items-center justify-center gap-2 text-center">
              Return to checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href="/dashboard" className="btn-primary flex w-full items-center justify-center gap-2 text-center">
              <FileText className="h-4 w-4" />
              View my account
            </Link>
          )}

          {status?.receiptAvailable && status?.topupId && (
            <Link
              href="/dashboard/receipts"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-surface-400 hover:text-text-main"
            >
              <ReceiptText className="h-4 w-4" />
              View receipt
            </Link>
          )}

          {(status?.state === 'FAILED' || status?.state === 'CANCELLED' || status?.state === 'EXPIRED') && (
            <Link
              href="/top-up"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-surface-400 hover:text-text-main"
            >
              Try again
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
