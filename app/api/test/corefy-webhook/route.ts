// app/api/test/corefy-webhook/route.ts - Helper to trigger signed test webhooks locally

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { config } from '@/lib/config'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referenceId, status = 'processed', amount = 10, currency = 'EUR' } = body

    // Find payment record by referenceId or take the latest initiated
    const payment = referenceId
      ? await prisma.transferMitTopup.findUnique({ where: { reference_id: referenceId } })
      : await prisma.transferMitTopup.findFirst({
          orderBy: { created_at: 'desc' },
        })

    const targetRef = payment?.reference_id || referenceId || `topup-test-${Date.now()}`
    const invoiceId = payment?.payment_id || `inv_test_${Date.now()}`

    const webhookPayload = {
      data: {
        id: invoiceId,
        type: 'payment-invoices',
        attributes: {
          status,
          resolution: status === 'processed' ? 'ok' : 'declined',
          amount: Number(payment?.amount || amount),
          currency: payment?.currency || currency,
          reference_id: targetRef,
          metadata: {
            reference_id: targetRef,
            user_id: payment?.user_id ? String(payment.user_id) : '1',
          },
        },
      },
    }

    const payloadString = JSON.stringify(webhookPayload)
    const secret = config.corefy.webhookSecret || 'test_secret'
    const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex')

    const requestOrigin = request.nextUrl.origin
    const webhookEndpoint = `${requestOrigin}/api/webhooks/corefy`

    const response = await fetch(webhookEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: payloadString,
    })

    const result = await response.json().catch(() => ({}))

    return NextResponse.json({
      webhookSentTo: webhookEndpoint,
      statusReceived: response.status,
      response: result,
      referenceId: targetRef,
      invoiceId,
    })
  } catch (error: any) {
    console.error('[Test Corefy Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
