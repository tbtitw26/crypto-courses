// app/api/test/corefy-status/route.ts - Status check for testing dashboard

import { NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const isMock =
      !config.corefy.accountId ||
      !config.corefy.apiKey ||
      config.corefy.apiKey === 'mock' ||
      process.env.COREFY_MOCK === 'true'

    const recentPayments = await prisma.transferMitTopup.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        reference_id: true,
        payment_id: true,
        amount: true,
        currency: true,
        tokens: true,
        state: true,
        topup_id: true,
        created_at: true,
      },
    })

    return NextResponse.json({
      config: {
        paymentProvider: config.paymentProvider,
        apiUrl: config.corefy.apiUrl,
        accountIdConfigured: Boolean(config.corefy.accountId),
        apiKeyConfigured: Boolean(config.corefy.apiKey),
        webhookSecretConfigured: Boolean(config.corefy.webhookSecret),
        serviceCode: config.corefy.serviceCode,
        mode: isMock ? 'Local Mock Simulator (No HTTPS needed)' : 'Live API (Connecting to Corefy)',
      },
      recentPayments,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
