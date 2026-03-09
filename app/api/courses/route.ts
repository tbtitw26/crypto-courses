// app/api/courses/route.ts - API route for fetching courses

import { NextResponse } from 'next/server'
import { prisma, withPrismaRetry, isPrismaConnectionError } from '@/lib/prisma'
import { resolvePublicUrl } from '@/lib/storage'
import { demoCourses } from '@/src/data/courses'

// Helper function to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Transform static course data to DB format
function transformStaticCourse(course: typeof demoCourses[0], index: number) {
  return {
    id: index + 1, // Temporary ID
    slug: course.slug,
    level: capitalizeFirst(course.level),
    market: capitalizeFirst(course.market),
    title: course.title,
    title_ar: undefined, // Static courses don't have Arabic translations
    description: course.shortDescription,
    description_ar: undefined, // Static courses don't have Arabic translations
    tokens: course.price.tokens,
    price_gbp: course.price.GBP,
    cover_image: `/images/courses/${course.slug}-cover.png`,
  }
}

export async function GET() {
  const requestId = crypto.randomUUID()

  try {
    const courses = await withPrismaRetry(
      () =>
        prisma.course.findMany({
          select: {
            id: true,
            slug: true,
            level: true,
            market: true,
            title: true,
            title_ar: true,
            description: true,
            description_ar: true,
            tokens: true,
            price_gbp: true,
            cover_image: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
      { maxRetries: 2, retryDelayMs: 200, timeoutMs: 2000 }
    )

    const coursesWithAssets = courses.map((course) => ({
      ...course,
      cover_image:
        resolvePublicUrl(course.cover_image) ?? course.cover_image ?? null,
    }))

    return NextResponse.json({ data: coursesWithAssets, source: 'db', requestId })
  } catch (error: any) {
    const isConn = isPrismaConnectionError(error)

    if (isConn) {
      console.warn('Database connection issue in /api/courses, using static fallback', {
        requestId,
        code: error?.code,
        name: error?.name,
        message: error?.message,
      })

      try {
        const staticCourses = demoCourses.map((course, index) =>
          transformStaticCourse(course, index)
        )

        const staticCoursesWithAssets = staticCourses.map((course) => ({
          ...course,
          cover_image:
            resolvePublicUrl(course.cover_image) ?? course.cover_image ?? null,
        }))

        return NextResponse.json({
          data: staticCoursesWithAssets,
          source: 'static',
          requestId,
        })
      } catch (fallbackError: any) {
        console.error('Error loading static courses fallback:', {
          requestId,
          message: fallbackError?.message,
        })

        return NextResponse.json(
          { data: [], source: 'static', requestId },
          { status: 200 }
        )
      }
    }

    console.error('Error fetching courses:', {
      requestId,
      code: error?.code,
      name: error?.name,
      message: error?.message,
      meta: error?.meta,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    })

    return NextResponse.json(
      {
        error: 'Failed to fetch courses',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        requestId,
      },
      { status: 500 }
    )
  }
}
