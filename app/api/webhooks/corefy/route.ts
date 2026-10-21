// app/api/webhooks/corefy/route.ts - Webhook handler for Corefy / Sterling Pay notifications

import { NextRequest, NextResponse } from 'next/server'
import { verifyCorefyWebhookSignature } from '@/lib/corefy-client'
import { processCorefyWebhookPayload } from '@/lib/topup-payment-flow'
import { config } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signatureHeader =
      request.headers.get('X-Signature') ||
      request.headers.get('Signature') ||
      request.headers.get('Signature-SHA256') ||
      request.headers.get('x-signature') ||
      request.headers.get('signature') ||
      request.headers.get('signature-sha256')

    // Verify HMAC signature if webhook secret is configured
    if (config.corefy.webhookSecret) {
      const isValid = verifyCorefyWebhookSignature(rawBody, signatureHeader)
      if (!isValid) {
        console.warn('[Corefy Webhook] Invalid or missing signature header:', signatureHeader)
        return NextResponse.json({ status: 'error', message: 'Invalid webhook signature' }, { status: 403 })
      }
    }

    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ status: 'error', message: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('[Corefy Webhook] Incoming notification:', {
      invoiceId: payload.data?.id,
      status: payload.data?.attributes?.status,
      referenceId:
        payload.data?.attributes?.metadata?.reference_id ||
        payload.data?.attributes?.reference_id,
    })

    const result = await processCorefyWebhookPayload(payload)

    if (!result.success) {
      console.warn('[Corefy Webhook] Processing warning:', result.message)
      return NextResponse.json({ status: 'error', message: result.message }, { status: 400 })
    }

    return NextResponse.json({ status: 'ok', message: result.message }, { status: 200 })
  } catch (error: any) {
    console.error('[Corefy Webhook] Handler error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Webhook processing failed', details: error?.message },
      { status: 500 }
    )
  }
}
