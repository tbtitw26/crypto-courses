// app/api/custom-course/[id]/route.ts - Single Custom Course status endpoint

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
    const courseRequest = await withPrismaRetry(() =>
      prisma.customCourseRequest.findUnique({
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

    if (!courseRequest) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify ownership
    if (courseRequest.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Map status to expected format
    const status = courseRequest.status as 'in_queue' | 'processing' | 'ready' | 'failed' | 'completed'
    const stage = (courseRequest.status_stage || 'queued') as 'queued' | 'generating' | 'rendering' | 'uploading' | 'done' | 'error'

    // Resolve PDF URL (signed URL for private bucket, public URL for public bucket)
    let pdfUrl: string | null = null
    if (status === 'ready' && courseRequest.pdf_url) {
      try {
        pdfUrl = await resolveDownloadUrl(courseRequest.pdf_url) || null
      } catch (error) {
        console.error('Failed to resolve PDF URL:', error)
        // Continue without PDF URL if resolution fails
      }
    }

    return NextResponse.json({
      jobId: courseRequest.id,
      status,
      stage,
      progress: courseRequest.status_progress ?? 0,
      error: courseRequest.status_error || null,
      result: pdfUrl ? { pdfUrl } : null,
      updatedAt: courseRequest.updated_at.toISOString(),
    })
  } catch (error) {
    console.error('Custom Course status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

