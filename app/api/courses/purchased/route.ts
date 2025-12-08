// app/api/courses/purchased/route.ts - API endpoint for user's purchased courses

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { resolvePublicUrl } from '@/lib/storage'
import { resolveCoursePdfUrl } from '@/lib/course-pdf-utils'

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
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Fetch purchased courses
    try {
      const purchases = await prisma.coursePurchase.findMany({
        where: { user_id: userId },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              title_ar: true,
              description: true,
              description_ar: true,
              level: true,
              market: true,
              tokens: true,
              price_gbp: true,
              pdf_path: true,
              cover_image: true,
              modules: true,
              duration_hours_min: true,
              duration_hours_max: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      })

      const courses = await Promise.all(
        purchases.map(async (purchase) => {
          const coverImage = resolvePublicUrl(purchase.course.cover_image) ?? purchase.course.cover_image ?? null
          const downloadUrl = await resolveCoursePdfUrl(purchase.course.pdf_path, purchase.language || 'en')

          return {
            ...purchase.course,
            cover_image: coverImage,
            downloadUrl,
            purchaseId: purchase.id,
            purchasedAt: purchase.created_at,
            purchaseLanguage: purchase.language,
            tokensSpent: purchase.tokens_cost,
          }
        })
      )

      return NextResponse.json({ courses })
    } catch (dbError: any) {
      // Handle case where CoursePurchase table doesn't exist yet
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.warn('[Purchased Courses API] CoursePurchase table does not exist yet')
        return NextResponse.json({ courses: [] })
      }

      console.error('[Purchased Courses API] Database error:', {
        userId,
        error: dbError.message,
        code: dbError.code,
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to fetch purchased courses' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Purchased Courses API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch purchased courses',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

