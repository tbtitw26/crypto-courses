// app/api/custom-course/route.ts - Custom Course generation API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { GenerationError } from '@/lib/openai/generate'
import { generateCustomCourseComplete } from '@/lib/pdf/custom-course'
import { getModelForFeature } from '@/lib/openai/client'
import { config } from '@/lib/config'
import { z } from 'zod'
import { sendPurchaseConfirmationEmail, sendCourseDeliveryEmail } from '@/lib/email'
import { generateReceiptPdf } from '@/lib/receipts/pdf-generator'
import { updateCustomCourseStatus, clearCustomCourseStatus, loadCustomCourseStatus } from '@/lib/pdf/custom-course-status-tracker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Base price: €200 = 20,000 tokens
const BASE_PRICE_TOKENS = 20000

// Validation schema
const customCourseSchema = z.object({
  experienceYears: z.enum(['0', '1-2', '3+']),
  depositBudget: z.string().min(1),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  markets: z.array(z.enum(['Forex', 'Crypto', 'Binary'])).min(1),
  tradingStyle: z.enum(['scalp', 'day', 'swing', 'position']),
  timeCommitment: z.string().optional(),
  goalsFreeText: z.string().min(10).max(2000),
  additionalNotes: z.string().optional(),
  languages: z.array(z.enum(['en', 'ar'])).min(1).max(2), // Required: at least 1, max 2 languages
  tokensCost: z.number().int().min(BASE_PRICE_TOKENS).optional(), // Optional for backward compatibility, but should be provided
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    // Parse and validate request body
    const body = await request.json()
    const validationResult = customCourseSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get tokens cost from request, or use base price as fallback
    const tokensCost = data.tokensCost || BASE_PRICE_TOKENS

    // Validate that tokensCost is at least base price (security check)
    if (tokensCost < BASE_PRICE_TOKENS) {
      return NextResponse.json(
        { error: 'Invalid tokens cost', message: `Tokens cost must be at least ${BASE_PRICE_TOKENS}` },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const balance = Number(user.balance)
    if (balance < tokensCost) {
      return NextResponse.json(
        { error: 'Insufficient token balance', required: tokensCost, current: balance },
        { status: 402 }
      )
    }

    // Calculate estimated ready time (for testing: set to now, will be changed back to 48-96 hours later)
    const estimatedReadyAt = new Date(Date.now() + 5 * 60 * 1000) // For testing: 5 minutes from now (was: 72 hours)

    // Deduct tokens from user balance FIRST (before creating request)
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: tokensCost,
        },
      },
    })

    // Create Custom Course Request record with processing status
    const courseRequest = await prisma.customCourseRequest.create({
      data: {
        user_id: userId,
        status: 'processing',
        experience_years: data.experienceYears,
        deposit_budget: data.depositBudget,
        risk_tolerance: data.riskTolerance,
        markets: data.markets,
        trading_style: data.tradingStyle,
        goals_free_text: data.goalsFreeText,
        additional_notes: data.additionalNotes,
        language: data.languages[0] || 'en', // Store first language for backward compatibility
        tokens_cost: tokensCost,
        estimated_ready_at: estimatedReadyAt,
        ai_model: getModelForFeature('course'),
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    })

    // Return response immediately (don't wait for generation)
    // Generation will happen in background
    const response = NextResponse.json({
      success: true,
      id: courseRequest.id,
      status: 'processing',
      message: 'Course generation started. You can close this window.',
      estimatedReadyAt: estimatedReadyAt.toISOString(),
    })

    // Clear any previous status
    await clearCustomCourseStatus()

    // Start generation in background (don't await - let it run asynchronously)
    // This allows the response to be sent immediately
    generateCourseInBackground(courseRequest.id, data, tokensCost, courseRequest.user.email).catch((error) => {
      console.error('[Custom Course API] Background generation error:', {
        courseRequestId: courseRequest.id,
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      // Update status to failed
      prisma.customCourseRequest
        .update({
          where: { id: courseRequest.id },
          data: { status: 'failed' },
        })
        .catch((updateError) => {
          console.error('[Custom Course API] Failed to update status to failed:', updateError)
        })
    })

    return response
  } catch (error: any) {
    console.error('Custom Course API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Generate course in background (async, non-blocking)
 */
async function generateCourseInBackground(
  courseRequestId: number,
  data: z.infer<typeof customCourseSchema>,
  tokensCost: number,
  userEmail: string
) {
  const startedAt = new Date().toISOString()
  
  // Get userId early for logging (in case of errors)
  let userIdForLogging: number | null = null
  try {
    const courseRequestForUserId = await prisma.customCourseRequest.findUnique({
      where: { id: courseRequestId },
      select: { user_id: true },
    })
    userIdForLogging = courseRequestForUserId?.user_id || null
  } catch (error) {
    // If we can't get userId, continue anyway - it's just for logging
    console.warn('[Custom Course API] Could not get userId for logging:', error)
  }
  
  try {
    await updateCustomCourseStatus({
      courseRequestId,
      stage: 'generating_en',
      progress: 10,
      message: 'Generating English course content...',
      startedAt,
    })

    // Import logger for detailed logging
    const { logger } = await import('@/lib/pdf/logger')
    await logger.info(`[Custom Course ${courseRequestId}] Starting generation...`, {
      courseRequestId,
      languages: data.languages,
      goalsFreeText: data.goalsFreeText.substring(0, 100),
    })

    // Generate complete Custom Course with PDFs
    // Note: generateCustomCourseComplete handles cover, diagrams, translation, and PDFs internally
    const result = await generateCustomCourseComplete({
        experienceYears: data.experienceYears,
        depositBudget: data.depositBudget,
        riskTolerance: data.riskTolerance,
        markets: data.markets,
        tradingStyle: data.tradingStyle,
        timeCommitment: data.timeCommitment,
        goalsFreeText: data.goalsFreeText,
        additionalNotes: data.additionalNotes,
        languages: data.languages,
      })

      await updateCustomCourseStatus({
        courseRequestId,
        courseId: result.courseId,
        stage: 'generating_pdf_en',
        progress: 60,
        message: 'Course content generated, PDFs created',
        intermediateFiles: {
          courseEnJson: result.courseEn ? 'generated' : undefined,
          courseArJson: result.courseAr ? 'generated' : undefined,
          coverImage: result.coverImagePath,
          diagrams: result.diagramImagePaths,
        },
      })

      // Store PDF URLs (array for multiple languages)
      const pdfUrls: string[] = []
      if (result.pdfEnPath) pdfUrls.push(result.pdfEnPath)
      if (result.pdfArPath) pdfUrls.push(result.pdfArPath)

      // Get user data for emails
      const courseRequestWithUser = await prisma.customCourseRequest.findUnique({
        where: { id: courseRequestId },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      })

      if (!courseRequestWithUser) {
        throw new Error(`Course request ${courseRequestId} not found`)
      }

      // Get userId from courseRequestWithUser for logging
      const userId = courseRequestWithUser.user.id

      await updateCustomCourseStatus({
        courseRequestId,
        courseId: result.courseId,
        stage: 'generating_pdf_en',
        progress: 70,
        message: 'PDFs generated, updating database...',
      })

      // Update course request with results (status: ready)
      const updatedCourseRequest = await prisma.customCourseRequest.update({
        where: { id: courseRequestId },
        data: {
          status: 'ready',
          ai_response_structured: result.courseEn as any, // Store full course structure
          ai_prompt: JSON.stringify({
            experienceYears: data.experienceYears,
            depositBudget: data.depositBudget,
            riskTolerance: data.riskTolerance,
            markets: data.markets,
            tradingStyle: data.tradingStyle,
            goalsFreeText: data.goalsFreeText,
            languages: data.languages,
          }),
          pdf_url: pdfUrls.length > 0 ? pdfUrls[0] : undefined, // Store first PDF for backward compatibility
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      })

      // Update userIdForLogging if we got it from updatedCourseRequest
      if (updatedCourseRequest.user.id) {
        userIdForLogging = updatedCourseRequest.user.id
      }

      await updateCustomCourseStatus({
        courseRequestId,
        courseId: result.courseId,
        stage: 'sending_emails',
        progress: 85,
        message: 'Sending emails...',
      })

      // Send email confirmation with invoice (non-blocking)
      try {
        const locale = (data.languages[0] === 'ar' ? 'ar' : 'en') as 'en' | 'ar'

        // Generate invoice PDF
        const invoiceNumber = `INV-${updatedCourseRequest.created_at.getFullYear()}-${updatedCourseRequest.id.toString().padStart(6, '0')}`
        const receiptData = {
          id: `custom-${updatedCourseRequest.id}`,
          type: 'Custom course',
          invoiceNumber,
          date: updatedCourseRequest.created_at,
          amount: 0, // Paid with tokens
          tokens: -updatedCourseRequest.tokens_cost,
          description: 'Custom course request',
          markets: updatedCourseRequest.markets,
          user: updatedCourseRequest.user,
        }

        const invoicePdfBuffer = await generateReceiptPdf(receiptData)

        // Send email
        await sendPurchaseConfirmationEmail({
          type: 'custom-course',
          transactionId: `custom-${updatedCourseRequest.id}`,
          userEmail: updatedCourseRequest.user.email,
          userName: `${updatedCourseRequest.user.first_name} ${updatedCourseRequest.user.last_name || ''}`.trim(),
          locale,
          invoicePdfBuffer,
          invoiceNumber,
          tokens: -updatedCourseRequest.tokens_cost,
          amountGbp: 0,
          customCourseDeliveryInfo: false, // We'll send PDF separately
        })

        console.log('[Custom Course API] Invoice email sent successfully:', {
          userId: userIdForLogging,
          transactionId: `custom-${updatedCourseRequest.id}`,
          locale,
        })
      } catch (emailError: any) {
        // Log error but don't block the purchase
        console.error('[Custom Course API] Error sending invoice email:', {
          userId: userIdForLogging,
          transactionId: `custom-${updatedCourseRequest.id}`,
          error: emailError.message,
          stack: emailError.stack,
        })
      }

      // Send course PDF delivery email (non-blocking)
      try {
        const locale = (data.languages[0] === 'ar' ? 'ar' : 'en') as 'en' | 'ar'
        
        // Build PDF attachments array
        const pdfBuffers: Array<{ buffer: Buffer; filename: string; language: 'en' | 'ar' }> = []
        
        if (result.pdfEnBuffer) {
          const filename = result.pdfEnPath 
            ? result.pdfEnPath.split('/').pop() || `${result.courseId}-en.pdf`
            : `${result.courseId}-en.pdf`
          pdfBuffers.push({
            buffer: result.pdfEnBuffer,
            filename,
            language: 'en',
          })
        }
        
        if (result.pdfArBuffer) {
          const filename = result.pdfArPath
            ? result.pdfArPath.split('/').pop() || `${result.courseId}-ar.pdf`
            : `${result.courseId}-ar.pdf`
          pdfBuffers.push({
            buffer: result.pdfArBuffer,
            filename,
            language: 'ar',
          })
        }

        if (pdfBuffers.length > 0) {
          await sendCourseDeliveryEmail({
            type: 'custom-course',
            userEmail: updatedCourseRequest.user.email,
            userName: `${updatedCourseRequest.user.first_name} ${updatedCourseRequest.user.last_name || ''}`.trim(),
            locale,
            courseId: result.courseId,
            pdfBuffers,
          })

          // Update status to completed after successful email delivery
          await prisma.customCourseRequest.update({
            where: { id: courseRequestId },
            data: { status: 'completed' },
          })

          await updateCustomCourseStatus({
            courseRequestId,
            courseId: result.courseId,
            stage: 'completed',
            progress: 100,
            message: 'Course generation completed successfully!',
            completedAt: new Date().toISOString(),
          })

          console.log('[Custom Course API] Course delivery email sent successfully:', {
            courseRequestId,
            courseId: result.courseId,
            pdfCount: pdfBuffers.length,
            locale,
          })
        } else {
          console.warn('[Custom Course API] No PDF buffers to send:', {
            courseRequestId,
            courseId: result.courseId,
          })
        }
      } catch (emailError: any) {
        // Log error but don't fail the generation
        console.error('[Custom Course API] Error sending course delivery email:', {
          courseRequestId,
          courseId: result.courseId,
          error: emailError.message,
          stack: emailError.stack,
        })
        // Status remains 'ready' if email fails
      }
    } catch (error) {
      const genError = error as GenerationError
      const errorMessage = genError.message || 'An error occurred during generation'
      const errorCode = genError.code || 'UNKNOWN'

      // Import logger for detailed error logging
      const { logger } = await import('@/lib/pdf/logger')
      await logger.error(`[Custom Course ${courseRequestId}] Generation failed:`, {
        courseRequestId,
        error: errorMessage,
        code: errorCode,
        details: genError.details,
        stack: error instanceof Error ? error.stack : undefined,
      })

      // Update status tracker
      await updateCustomCourseStatus({
        courseRequestId,
        stage: 'error',
        progress: 0,
        message: `Error: ${errorMessage}`,
        error: errorMessage,
      })

      // Update course request with error status
      await prisma.customCourseRequest.update({
        where: { id: courseRequestId },
        data: {
          status: 'failed',
        },
      })

      console.error('[Custom Course API] Background generation error:', {
        courseRequestId,
        error: errorMessage,
        code: errorCode,
        details: genError.details,
      })

      // Re-throw to be caught by outer catch
      throw error
    }
}

