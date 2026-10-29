// lib/consent.ts - Checkout consent validation and storage

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export const CONSENT_VERSION = '2026-10-27'

/** Canonical (English) wording stored with every consent record. */
const CONSENT_TEXT = {
  terms: 'I have read and accept the Terms & Conditions and the Refund Policy.',
  immediateSupply:
    'I request immediate supply of this digital content and understand that once supply has started I lose my right to cancel and to a refund, except where the law says otherwise.',
  preparation:
    'I request that preparation of my custom course starts now. I understand that I can still cancel until the course is delivered and that, where the law allows, a proportionate amount may be charged for preparation already carried out.',
}

/** Ready-made courses and AI outputs are supplied at once; custom courses are a service prepared over 48–96 hours. */
export type SupplyConsentKind = 'immediate' | 'preparation'

/** Usage Unit top-ups: Terms & Refund Policy only. Buying Units is not consent to supply any product. */
export const topupConsentSchema = z.object({
  termsAccepted: z.literal(true),
})

/** Products paid with Usage Units: Terms plus a separate supply consent (immediate supply or start of preparation). */
export const productConsentSchema = z.object({
  termsAccepted: z.literal(true),
  immediateSupply: z.literal(true),
})

export type OrderType = 'topup' | 'course' | 'custom_course' | 'ai_strategy'

export const CONSENT_REQUIRED_ERROR = {
  error: 'Consent required',
  message: 'Please accept the Terms & Refund Policy and confirm the supply request before ordering.',
}

export async function recordOrderConsent(params: {
  userId: number
  orderType: OrderType
  orderRef: string
  immediateSupply: boolean
  supplyKind?: SupplyConsentKind
  locale?: string
  request?: NextRequest
}) {
  const { userId, orderType, orderRef, immediateSupply, supplyKind = 'immediate', locale, request } = params
  const supplyText = supplyKind === 'preparation' ? CONSENT_TEXT.preparation : CONSENT_TEXT.immediateSupply
  const consentText = immediateSupply ? `${CONSENT_TEXT.terms}\n${supplyText}` : CONSENT_TEXT.terms

  return withPrismaRetry(() =>
    prisma.orderConsent.create({
      data: {
        user_id: userId,
        order_type: orderType,
        order_ref: orderRef,
        terms_accepted: true,
        immediate_supply: immediateSupply,
        // Starting preparation of a custom course does not end the right to cancel
        withdrawal_loss_ack: immediateSupply && supplyKind === 'immediate',
        consent_version: CONSENT_VERSION,
        consent_text: consentText,
        locale: locale ?? null,
        ip_address:
          request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request?.headers.get('x-real-ip') ||
          null,
        user_agent: request?.headers.get('user-agent') ?? null,
      },
    })
  )
}

export async function findOrderConsent(orderType: OrderType, orderRef: string) {
  return withPrismaRetry(() =>
    prisma.orderConsent.findFirst({
      where: { order_type: orderType, order_ref: orderRef },
      orderBy: { created_at: 'desc' },
    })
  )
}
