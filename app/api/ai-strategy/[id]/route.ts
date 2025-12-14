// app/api/ai-strategy/[id]/route.ts - Single AI Strategy status endpoint

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { resolveDownloadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { id } = await params
    const jobId = parseInt(id, 10)

    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    // Fetch job from database
    const strategyRun = await withPrismaRetry(() =>
      prisma.aiStrategyRun.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          status: true,
          status_stage: true,
          status_progress: true,
          status_message: true,
          status_error: true,
          pdf_url: true,
          updated_at: true,
          user_id: true,
        },
      })
    )

    if (!strategyRun) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify ownership
    if (strategyRun.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Map status to expected format
    const status = strategyRun.status as 'in_queue' | 'processing' | 'ready' | 'failed'
    const stage = (strategyRun.status_stage || 'queued') as 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'error'

    // Resolve PDF URL (signed URL for private bucket, public URL for public bucket)
    let pdfUrl: string | null = null
    if (status === 'ready' && strategyRun.pdf_url) {
      try {
        pdfUrl = await resolveDownloadUrl(strategyRun.pdf_url) || null
      } catch (error) {
        console.error('Failed to resolve PDF URL:', error)
        // Continue without PDF URL if resolution fails
      }
    }

    return NextResponse.json({
      jobId: strategyRun.id,
      status,
      stage,
      progress: strategyRun.status_progress ?? 0,
      error: strategyRun.status_error || null,
      result: pdfUrl ? { pdfUrl } : null,
      updatedAt: strategyRun.updated_at.toISOString(),
    })
  } catch (error) {
    console.error('AI Strategy status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

