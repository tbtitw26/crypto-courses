// app/api/webhooks/madfin/route.ts - Webhook handler for Madfin Gateway notifications

import { NextRequest, NextResponse } from 'next/server'
import { verifyMadfinWebhookSignature } from '@/lib/madfin-client'
import { processMadfinWebhookPayload } from '@/lib/topup-payment-flow'
import { config } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signatureHeader =
      request.headers.get('Signature') ||
      request.headers.get('signature') ||
      request.headers.get('x-signature')

    // Verify HMAC-SHA256 signature if signing key is configured
    if (config.madfin.signingKey) {
      const isValid = verifyMadfinWebhookSignature(rawBody, signatureHeader)
      if (!isValid) {
        console.warn('[Madfin Webhook] Invalid or missing signature header:', signatureHeader)
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
    }

    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('[Madfin Webhook] Processing notification:', {
      id: payload.id,
      paymentType: payload.paymentType,
      state: payload.state,
      referenceId: payload.referenceId,
    })

    const result = await processMadfinWebhookPayload(payload)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ received: true, message: result.message }, { status: 200 })
  } catch (error: any) {
    console.error('[Madfin Webhook] Handler error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error?.message },
      { status: 500 }
    )
  }
}
