// app/api/download/[type]/[jobId]/route.ts - Download redirect route for PDFs

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { resolveDownloadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; jobId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(url)
    }

    const userId = parseInt(session.user.id)
    const jobId = parseInt(params.jobId)
    const type = params.type as 'custom' | 'ai-strategy'

    if (Number.isNaN(jobId) || Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid job ID or user ID' }, { status: 400 })
    }

    if (type !== 'custom' && type !== 'ai-strategy') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Load job and verify ownership
    let job: any = null
    if (type === 'custom') {
      job = await withPrismaRetry(() =>
        prisma.customCourseRequest.findUnique({
          where: { id: jobId },
          select: {
            id: true,
            user_id: true,
            status: true,
            pdf_url: true,
          },
        })
      )
    } else {
      job = await withPrismaRetry(() =>
        prisma.aiStrategyRun.findUnique({
          where: { id: jobId },
          select: {
            id: true,
            user_id: true,
            status: true,
            pdf_url: true,
          },
        })
      )
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (job.status !== 'ready' && job.status !== 'completed') {
      return NextResponse.redirect(
        new URL(`/dashboard${type === 'custom' ? '/custom-courses' : '/ai-strategies'}?error=not_ready`, request.url)
      )
    }

    if (!job.pdf_url) {
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 })
    }

    let downloadUrl: string | undefined
    try {
      downloadUrl = await resolveDownloadUrl(job.pdf_url)
    } catch (err) {
      console.error('[Download Route] resolveDownloadUrl threw:', {
        jobId,
        type,
        pdf_url_prefix: job.pdf_url?.substring(0, 30),
        error: err instanceof Error ? err.message : String(err),
      })
    }
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    // Redirect to signed URL
    return NextResponse.redirect(downloadUrl)
  } catch (error) {
    console.error('[Download Route] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process download request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

