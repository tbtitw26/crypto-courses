// app/api/orders/[type]/[id]/respond/route.ts - Customer response to a delayed order

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { respondToDelay } from '@/lib/orders'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const respondSchema = z.object({
  action: z.enum(['accept', 'cancel']),
})

const ERROR_STATUS = { not_found: 404, forbidden: 403, not_delayed: 409 } as const

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { type, id } = await params
    const jobId = parseInt(id, 10)

    if ((type !== 'custom' && type !== 'ai') || Number.isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
    }

    const validation = respondSchema.safeParse(await request.json().catch(() => null))
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const result = await respondToDelay(type, jobId, userId, validation.data.action)
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: ERROR_STATUS[result.code] })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Order Respond API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
