import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { config } from '@/lib/config'
import { createHostedTopupSession } from '@/lib/topup-payment-flow'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = Number.parseInt(session.user.id, 10)
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const body = await request.json()
    const requestOrigin = request.nextUrl.origin
    const isLocalRequest = /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(requestOrigin)
    const baseUrl = isLocalRequest ? requestOrigin : config.site.baseUrl || requestOrigin

    const result = await createHostedTopupSession({
      userId,
      userEmail: session.user.email,
      body,
      baseUrl,
      customerIpAddress:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Top-up Init API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create payment session',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
