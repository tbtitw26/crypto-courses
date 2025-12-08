// app/api/courses/route.ts - API route for fetching courses

import { NextResponse } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'
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
    cover_image: `/images/courses/${course.slug}-cover.webp`,
  }
}

export async function GET() {
  try {
    const courses = await withPrismaRetry(() =>
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
    }))

    const coursesWithAssets = courses.map((course) => ({
      ...course,
      cover_image: resolvePublicUrl(course.cover_image) ?? course.cover_image ?? null,
    }))

    return NextResponse.json(coursesWithAssets)
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    
    // Если БД недоступна, используем статические данные как fallback
    const isDatabaseError = 
      error?.code?.startsWith('P') || // Prisma error codes (P1001, P2025, etc.)
      error?.message?.includes('does not exist') ||
      error?.message?.includes('relation') ||
      error?.message?.includes('table') ||
      error?.message?.includes('database') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('Can\'t reach database') ||
      error?.name === 'PrismaClientInitializationError' ||
      error?.name === 'PrismaClientKnownRequestError' ||
      error?.name === 'PrismaClientUnknownRequestError'
    
    if (isDatabaseError) {
      console.warn('Database connection issue, using static fallback data:', error?.code || error?.name)
      
      // Используем статические данные как fallback
      try {
        const staticCourses = demoCourses.map((course, index) => 
          transformStaticCourse(course, index)
        )
        return NextResponse.json(staticCourses)
      } catch (fallbackError) {
        console.error('Error loading static courses:', fallbackError)
        return NextResponse.json([])
      }
    }

    // Для других ошибок возвращаем ошибку, но с более детальной информацией
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

