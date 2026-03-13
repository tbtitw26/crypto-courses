import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getTopupStatus } from '@/lib/topup-payment-flow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = Number.parseInt(session.user.id, 10)
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const referenceId = request.nextUrl.searchParams.get('reference')
    if (!referenceId) {
      return NextResponse.json({ error: 'Missing reference parameter' }, { status: 400 })
    }

    const status = await getTopupStatus(referenceId, userId)
    if (!status.found) {
      return NextResponse.json(status, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('[Top-up Status API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch top-up status',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

