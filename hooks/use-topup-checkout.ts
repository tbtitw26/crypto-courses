// hooks/use-topup-checkout.ts - Direct card checkout for token packs and custom top-ups
//
// Token purchases never go through the cart: they are card-only. Before the
// hosted payment session starts, the buyer reviews the order and accepts the
// Terms & Refund Policy in a confirmation dialog. The cart is reserved for
// courses, which can be paid with either a card or an existing token balance.

'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'

interface TopupRequest {
  /** Exact token amount to credit (token packs). */
  tokens?: number
  /** Amount in `currency` to charge (custom top-up). */
  amount?: number
  currency: string
  /** Identifier used for the hosted session, e.g. `token-pack-focused-start`. */
  slug?: string
  /** Product name shown in the confirmation dialog, e.g. the pack name. */
  label?: string
}

export interface TopupConfirmState {
  request: TopupRequest | null
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (consent: { termsAccepted: boolean }) => void
}

export function useTopupCheckout(callbackUrl: string) {
  const { status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const t = useTranslations('topUp.checkout')
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<{ request: TopupRequest; key: string } | null>(null)

  /** Opens the confirmation dialog; payment starts only after the buyer confirms. */
  const startTopup = useCallback(
    (request: TopupRequest, key = request.slug ?? 'custom') => {
      if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }
      if (status === 'loading' || pendingKey) return
      setConfirmRequest({ request, key })
    },
    [status, router, callbackUrl, pendingKey]
  )

  const submitTopup = useCallback(
    async (request: TopupRequest, key: string, consent: { termsAccepted: boolean }) => {
      setPendingKey(key)
      try {
        const body =
          request.tokens && request.tokens > 0
            ? {
                items: [
                  {
                    slug: request.slug ?? 'token-pack',
                    tokens: request.tokens,
                    price_gbp: request.tokens / 100,
                  },
                ],
                currency: request.currency,
                totalTokens: request.tokens,
              }
            : { amount: request.amount, currency: request.currency }

        const response = await fetch('/api/topup/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, consent }),
        })

        const result = await response.json().catch(() => ({}))

        if (response.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
          return
        }
        if (!response.ok) {
          throw new Error(result.error || result.message || t('sessionFailed'))
        }
        if (!result.redirectUrl) {
          throw new Error(t('noRedirect'))
        }

        window.location.href = result.redirectUrl
      } catch (error: any) {
        showToast({
          title: t('failed'),
          description: error?.message || t('tryLater'),
          variant: 'error',
        })
        setPendingKey(null)
      }
    },
    [router, callbackUrl, showToast, t]
  )

  const confirmDialog: TopupConfirmState = {
    request: confirmRequest?.request ?? null,
    isSubmitting: pendingKey !== null,
    onCancel: () => setConfirmRequest(null),
    onConfirm: (consent) => {
      if (confirmRequest) void submitTopup(confirmRequest.request, confirmRequest.key, consent)
    },
  }

  return { startTopup, pendingKey, isPending: pendingKey !== null, confirmDialog }
}
