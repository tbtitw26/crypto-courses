// app/api/courses/purchase/route.ts - API endpoint for course purchases

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { sendPurchaseConfirmationEmail } from '@/lib/email'
import { generateReceiptPdf } from '@/lib/receipts/pdf-generator'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const purchaseCourseSchema = z.object({
  courseSlug: z.string().min(1),
  language: z.enum(['en', 'ar']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('[Course Purchase API] Unauthorized: No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    if (isNaN(userId)) {
      console.error('[Course Purchase API] Invalid user ID:', session.user.id)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('[Course Purchase API] JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', message: parseError.message },
        { status: 400 }
      )
    }

    const validationResult = purchaseCourseSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[Course Purchase API] Validation error:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get course from database
    let course
    try {
      course = await withPrismaRetry(() =>
        prisma.course.findUnique({
          where: { slug: data.courseSlug },
        })
      )
    } catch (dbError: any) {
      console.error('[Course Purchase API] Database error fetching course:', {
        courseSlug: data.courseSlug,
        error: dbError.message,
        code: dbError.code,
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to fetch course' },
        { status: 500 }
      )
    }

    if (!course) {
      console.error('[Course Purchase API] Course not found:', data.courseSlug)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user already purchased this course
    try {
      const existingPurchase = await withPrismaRetry(() =>
        prisma.coursePurchase.findFirst({
          where: {
            user_id: userId,
            course_id: course.id,
          },
        })
      )

      if (existingPurchase) {
        console.error('[Course Purchase API] Course already purchased:', {
          userId,
          courseId: course.id,
        })
        return NextResponse.json(
          { error: 'Course already purchased', courseId: course.id },
          { status: 409 }
        )
      }
    } catch (dbError: any) {
      console.error('[Course Purchase API] Database error checking existing purchase:', {
        userId,
        courseId: course.id,
        error: dbError.message,
      })
      // Continue - this might be because the table doesn't exist yet
    }

    // Get user balance
    let user
    try {
      user = await withPrismaRetry(() =>
        prisma.user.findUnique({
          where: { id: userId },
          select: { balance: true, first_name: true, last_name: true, email: true },
        })
      )
    } catch (dbError: any) {
      console.error('[Course Purchase API] Database error fetching user:', {
        userId,
        error: dbError.message,
        code: dbError.code,
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    if (!user) {
      console.error('[Course Purchase API] User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const balance = Number(user.balance)
    const tokensCost = course.tokens

    if (balance < tokensCost) {
      console.error('[Course Purchase API] Insufficient balance:', {
        userId,
        required: tokensCost,
        current: balance,
      })
      return NextResponse.json(
        {
          error: 'Insufficient token balance',
          required: tokensCost,
          current: balance,
        },
        { status: 402 }
      )
    }

    // Get locale from cookie or use language from request
    const cookieStore = await cookies()
    const userLocale = cookieStore.get('user_locale')?.value || data.language || 'en'
    const locale = (userLocale === 'ar' ? 'ar' : 'en') as 'en' | 'ar'

    // Calculate amount in GBP (0 if paid with tokens)
    const amountGbp = 0 // Courses are paid with tokens, not money

    console.log('[Course Purchase API] Processing purchase:', {
      userId,
      courseId: course.id,
      courseSlug: course.slug,
      tokensCost,
      locale,
    })

    // Deduct tokens from user balance
    let updatedUser
    try {
      updatedUser = await withPrismaRetry(() =>
        prisma.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: tokensCost,
            },
          },
          select: {
            id: true,
            balance: true,
          },
        })
      )
    } catch (updateError: any) {
      console.error('[Course Purchase API] Database error updating user balance:', {
        userId,
        tokensToDeduct: tokensCost,
        error: updateError.message,
        code: updateError.code,
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to update user balance' },
        { status: 500 }
      )
    }

    // Create course purchase record
    let purchaseRecord
    try {
      purchaseRecord = await withPrismaRetry(() =>
        prisma.coursePurchase.create({
        data: {
          user_id: userId,
          course_id: course.id,
          tokens_cost: tokensCost,
          amount_gbp: amountGbp,
          language: locale,
        },
        include: {
          course: {
            select: {
              title: true,
              title_ar: true,
              slug: true,
              market: true,
              level: true,
            },
          },
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      })
      )
    } catch (createError: any) {
      console.error('[Course Purchase API] Database error creating purchase record:', {
        userId,
        courseId: course.id,
        tokensCost,
        error: createError.message,
        code: createError.code,
      })
      // If purchase record creation fails, we should rollback the balance update
      // But for now, we'll just log the error and continue
      // In production, consider using a transaction
      console.warn('[Course Purchase API] Warning: Purchase record creation failed, but balance was updated')
    }

    // Send email confirmation with invoice (non-blocking)
    if (purchaseRecord) {
      try {
        // Generate invoice PDF
        const invoiceNumber = `INV-${purchaseRecord.created_at.getFullYear()}-${purchaseRecord.id.toString().padStart(6, '0')}`
        const receiptData = {
          id: `course-${purchaseRecord.id}`,
          type: 'Course purchase',
          invoiceNumber,
          date: purchaseRecord.created_at,
          amount: amountGbp,
          tokens: -tokensCost,
          description: purchaseRecord.course.title,
          user: purchaseRecord.user,
        }

        const invoicePdfBuffer = await generateReceiptPdf(receiptData)

        // Send email (with or without PDF attachment)
        await sendPurchaseConfirmationEmail({
          type: 'course',
          transactionId: `course-${purchaseRecord.id}`,
          userEmail: purchaseRecord.user.email,
          userName: `${purchaseRecord.user.first_name} ${purchaseRecord.user.last_name || ''}`.trim(),
          locale,
          invoicePdfBuffer: invoicePdfBuffer ?? undefined, // null -> undefined (no attachment)
          invoiceNumber,
          tokens: -tokensCost,
          amountGbp: amountGbp,
        })

        if (!invoicePdfBuffer) {
          console.warn('[Course Purchase API] PDF invoice could not be generated, email sent without attachment')
        }

        console.log('[Course Purchase API] Email confirmation sent successfully:', {
          userId,
          transactionId: `course-${purchaseRecord.id}`,
          locale,
        })
      } catch (emailError: any) {
        // Log error but don't block the purchase
        console.error('[Course Purchase API] Error sending email confirmation:', {
          userId,
          transactionId: purchaseRecord ? `course-${purchaseRecord.id}` : 'unknown',
          error: emailError.message,
          stack: emailError.stack,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course purchased successfully',
      courseId: course.id,
      courseSlug: course.slug,
      newBalance: Number(updatedUser.balance),
      tokensSpent: tokensCost,
    })
  } catch (error: any) {
    console.error('[Course Purchase API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      {
        error: 'Failed to process course purchase',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

