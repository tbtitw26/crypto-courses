// app/api/courses/[slug]/route.ts - API route for fetching a single course by slug

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { demoCourses } from '@/src/data/courses'
import { resolvePublicUrl } from '@/lib/storage'

// Helper function to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Transform static course data to DB format
function transformStaticCourse(course: typeof demoCourses[0]) {
  return {
    id: 1, // Temporary ID
    slug: course.slug,
    title: course.title,
    title_ar: null,
    description: course.longDescription,
    description_ar: null,
    level: capitalizeFirst(course.level),
    market: capitalizeFirst(course.market),
    tokens: course.price.tokens,
    price_gbp: course.price.GBP,
    pdf_path: course.pdfUrl,
    cover_image: `/images/courses/${course.slug}-cover.png`,
    featured: course.isFeatured,
    modules: course.modules.map((m) => ({
      order: m.order,
      title: m.title,
      summary: m.summary,
    })),
    duration_hours_min: course.durationHoursMin,
    duration_hours_max: course.durationHoursMax,
    created_at: new Date(),
  }
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: params.slug },
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
        featured: true,
        modules: true,
        duration_hours_min: true,
        duration_hours_max: true,
        created_at: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const courseWithAssets = {
      ...course,
      cover_image: resolvePublicUrl(course.cover_image) ?? course.cover_image ?? null,
    }

    return NextResponse.json(courseWithAssets)
  } catch (error: any) {
    console.error('Error fetching course:', error)
    
    // Если БД недоступна, используем статические данные как fallback
    const isDatabaseError = 
      error?.code?.startsWith('P') ||
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
      
      // Ищем курс в статических данных
      try {
        const staticCourse = demoCourses.find((c) => c.slug === params.slug)
        
        if (!staticCourse) {
          return NextResponse.json(
            { error: 'Course not found' },
            { status: 404 }
          )
        }
        
        const transformedCourse = transformStaticCourse(staticCourse)
        return NextResponse.json(transformedCourse)
      } catch (fallbackError) {
        console.error('Error loading static course:', fallbackError)
        return NextResponse.json(
          { error: 'Database unavailable' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch course',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

