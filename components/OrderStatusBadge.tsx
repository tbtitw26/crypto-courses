// components/OrderStatusBadge.tsx - Order status badge and delay response for custom courses and AI strategies

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { AlertTriangle, Ban, CheckCircle2, Clock, Loader2, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { OrderKind, OrderStatus } from '@/lib/order-status'

const STATUS_STYLES: Record<OrderStatus, { classes: string; border: string; icon: typeof Clock }> = {
  processing: { classes: 'border-blue-200 bg-blue-50 text-blue-700', border: 'border-l-blue-500', icon: Clock },
  ready: { classes: 'border-emerald-200 bg-emerald-50 text-emerald-700', border: 'border-l-emerald-500', icon: CheckCircle2 },
  delayed: { classes: 'border-amber-200 bg-amber-50 text-amber-700', border: 'border-l-amber-500', icon: AlertTriangle },
  cancelled: { classes: 'border-surface-300 bg-surface-100 text-text-secondary', border: 'border-l-surface-300', icon: Ban },
  refunded: { classes: 'border-surface-300 bg-surface-100 text-text-secondary', border: 'border-l-surface-300', icon: RotateCcw },
}

export function orderStatusBorder(status: OrderStatus) {
  return STATUS_STYLES[status].border
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('dashboard.orderStatus')
  const { classes, icon: Icon } = STATUS_STYLES[status]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{t(`labels.${status}`)}</span>
    </span>
  )
}

interface DelayedOrderNoticeProps {
  kind: OrderKind
  orderId: string
  proposedReadyAt?: string | null
  tokens: number
  intlLocale: string
  onResolved: (result: { status: OrderStatus; newDate?: string }) => void
}

/** Shown on delayed orders: accept the new date or cancel and get the Usage Units back. */
export function DelayedOrderNotice({ kind, orderId, proposedReadyAt, tokens, intlLocale, onResolved }: DelayedOrderNoticeProps) {
  const t = useTranslations('dashboard.orderStatus.delayed')
  const { update: updateSession } = useSession()
  const { showToast } = useToast()
  const [pending, setPending] = useState<'accept' | 'cancel' | null>(null)

  const respond = async (action: 'accept' | 'cancel') => {
    setPending(action)
    try {
      const response = await fetch(`/api/orders/${kind}/${orderId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || t('failed'))

      if (action === 'cancel') await updateSession()
      showToast({
        title: action === 'accept' ? t('acceptedTitle') : t('refundedTitle'),
        description: action === 'accept' ? t('acceptedDescription') : t('refundedDescription', { tokens: tokens.toLocaleString('en-US') }),
        variant: 'success',
      })
      onResolved({ status: result.status, newDate: result.newDate })
    } catch (error) {
      showToast({ title: t('failed'), description: error instanceof Error ? error.message : undefined, variant: 'error' })
    } finally {
      setPending(null)
    }
  }

  const newDate = proposedReadyAt
    ? new Date(proposedReadyAt).toLocaleString(intlLocale, { dateStyle: 'medium', timeStyle: 'short' })
    : t('dateToBeAgreed')

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-800">{t('title')}</p>
      <p className="mt-1 text-sm text-amber-700">{t('description', { date: newDate })}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => respond('accept')}
          className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {pending === 'accept' && <Loader2 className="h-3 w-3 animate-spin" />}
          {t('accept')}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => respond('cancel')}
          className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {pending === 'cancel' && <Loader2 className="h-3 w-3 animate-spin" />}
          {t('cancel', { tokens: tokens.toLocaleString('en-US') })}
        </button>
      </div>
    </div>
  )
}
