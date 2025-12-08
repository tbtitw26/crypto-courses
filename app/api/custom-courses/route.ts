// app/api/custom-courses/route.ts - Get user's custom courses list

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { resolveDownloadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Fetch custom course requests for the user
    const customCourses = await withPrismaRetry(() =>
      prisma.customCourseRequest.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          status: true,
          goals_free_text: true,
          markets: true,
          experience_years: true,
          risk_tolerance: true,
          trading_style: true,
          pdf_url: true,
          created_at: true,
          updated_at: true,
          estimated_ready_at: true,
        },
      })
    )

    // Transform to frontend format
    const courses = await Promise.all(customCourses.map(async (course) => {
      // Determine level from experience_years
      let level = 'Beginner'
      if (course.experience_years === '1-2') {
        level = 'Intermediate'
      } else if (course.experience_years === '3+') {
        level = 'Advanced'
      }

      // Determine status for UI
      let uiStatus: 'Processing' | 'Completed' | 'Failed' = 'Processing'
      if (course.status === 'completed') {
        uiStatus = 'Completed'
      } else if (course.status === 'ready') {
        uiStatus = 'Completed' // Ready means PDF is generated, treat as completed
      } else if (course.status === 'failed') {
        uiStatus = 'Failed'
      } else {
        uiStatus = 'Processing'
      }

      const resolvedPdfUrl = await resolveDownloadUrl(course.pdf_url)

      return {
        id: course.id.toString(),
        title: course.goals_free_text.substring(0, 100) + (course.goals_free_text.length > 100 ? '...' : ''),
        market: course.markets.join(', '),
        level,
        status: uiStatus,
        dbStatus: course.status, // Keep original status for reference
        created: course.created_at.toISOString(),
        updated: course.updated_at.toISOString(),
        estimatedReadyAt: course.estimated_ready_at?.toISOString(),
        pdfUrl: resolvedPdfUrl,
      }
    }))

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching custom courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom courses', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

