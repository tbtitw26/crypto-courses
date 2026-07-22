// hooks/use-topup-checkout.ts - Direct card checkout for token packs and custom top-ups
//
// Token purchases never go through the cart: they are card-only and are sent
// straight to the hosted payment session. The cart is reserved for courses,
// which can be paid with either a card or an existing token balance.

'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

interface TopupRequest {
  /** Exact token amount to credit (token packs). */
  tokens?: number
  /** Amount in `currency` to charge (custom top-up). */
  amount?: number
  currency: string
  /** Identifier used for the hosted session, e.g. `token-pack-focused-start`. */
  slug?: string
}

export function useTopupCheckout(callbackUrl: string) {
  const { status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const startTopup = useCallback(
    async (request: TopupRequest, key = request.slug ?? 'custom') => {
      if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }
      if (status === 'loading' || pendingKey) return

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
          body: JSON.stringify(body),
        })

        const result = await response.json().catch(() => ({}))

        if (response.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
          return
        }
        if (!response.ok) {
          throw new Error(result.error || result.message || 'Failed to create payment session')
        }
        if (!result.redirectUrl) {
          throw new Error('No redirect URL received from payment gateway')
        }

        window.location.href = result.redirectUrl
      } catch (error: any) {
        showToast({
          title: 'Payment failed',
          description: error?.message || 'Please try again in a moment.',
          variant: 'error',
        })
        setPendingKey(null)
      }
    },
    [status, router, callbackUrl, pendingKey, showToast]
  )

  return { startTopup, pendingKey, isPending: pendingKey !== null }
}
