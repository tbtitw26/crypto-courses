// app/api/custom-course/route.ts - Custom Course generation API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { getModelForFeature } from '@/lib/openai/client'
import { z } from 'zod'
import { inngest } from '@/inngest/client'
import type { CustomCourseRequestedEvent } from '@/inngest/types'
import { CONSENT_REQUIRED_ERROR, productConsentSchema, recordOrderConsent } from '@/lib/consent'
import { CUSTOM_COURSE_DELIVERY_HOURS, formatOrderRef } from '@/lib/order-status'
import { sendPurchaseConfirmationEmail } from '@/lib/email'
import { LOCALE_COOKIE } from '@/i18n/config'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

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
  consent: productConsentSchema.optional(),
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
      const fieldErrors = validationResult.error.errors.map((e) =>
        e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message
      )
      return NextResponse.json(
        {
          error: 'Invalid request data',
          message: fieldErrors.join('; '),
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    if (!data.consent) {
      return NextResponse.json(CONSENT_REQUIRED_ERROR, { status: 400 })
    }

    // Get tokens cost from request, or use base price as fallback
    const tokensCost = data.tokensCost || BASE_PRICE_TOKENS

    // Validate that tokensCost is at least base price (security check)
    if (tokensCost < BASE_PRICE_TOKENS) {
      return NextResponse.json(
        { error: 'Invalid Usage Units cost', message: `Usage Units cost must be at least ${BASE_PRICE_TOKENS}` },
        { status: 400 }
      )
    }

    const user = await withPrismaRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true, email: true },
      })
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const balance = Number(user.balance)
    if (balance < tokensCost) {
      return NextResponse.json(
        { error: 'Insufficient Usage Balance', required: tokensCost, current: balance },
        { status: 402 }
      )
    }

    // Delivery date: a random point 48–96 hours from now. The PDF is generated straight away,
    // but the dashboard and the delivery email only release it at this time.
    const { min, max } = CUSTOM_COURSE_DELIVERY_HOURS
    const deliveryHours = min + Math.random() * (max - min)
    const estimatedReadyAt = new Date(Date.now() + deliveryHours * 60 * 60 * 1000)

    // Step 1: Create job row(s) in Neon - one per language
    const languages = data.languages || ['en']
    const userEmail = user.email || ''
    
    const courseRequests = await Promise.all(
      languages.map((lang) =>
        withPrismaRetry(() =>
          prisma.customCourseRequest.create({
            data: {
              user_id: userId,
              status: 'in_queue',
              status_stage: 'queued',
              status_progress: 0,
              experience_years: data.experienceYears,
              deposit_budget: data.depositBudget,
              risk_tolerance: data.riskTolerance,
              markets: data.markets,
              trading_style: data.tradingStyle,
              goals_free_text: data.goalsFreeText,
              additional_notes: data.additionalNotes,
              language: lang,
              tokens_cost: tokensCost,
              estimated_ready_at: estimatedReadyAt,
              request_payload: { timeCommitment: data.timeCommitment ?? null },
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
        )
      )
    )

    // Step 2: Deduct tokens from user balance
    try {
      await withPrismaRetry(() =>
        prisma.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: tokensCost,
            },
          },
        })
      )
    } catch (tokenError) {
      // If token deduction fails, mark all jobs as failed
      await Promise.all(
        courseRequests.map((courseRequest) =>
          withPrismaRetry(() =>
            prisma.customCourseRequest.update({
              where: { id: courseRequest.id },
              data: {
                status: 'cancelled',
                status_stage: 'error',
                cancelled_at: new Date(),
                status_error: `Usage Unit deduction failed: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`,
              },
            })
          )
        )
      )
      return NextResponse.json(
        { error: 'Failed to deduct Usage Units', message: 'Usage Unit deduction failed. Please try again.' },
        { status: 500 }
      )
    }

    // Step 3: Record consent and confirm the order by email (non-blocking for the order itself)
    const locale = request.cookies.get(LOCALE_COOKIE)?.value
    for (const courseRequest of courseRequests) {
      const orderRef = formatOrderRef('custom', courseRequest.id)
      try {
        const consent = await recordOrderConsent({
          userId,
          orderType: 'custom_course',
          orderRef,
          immediateSupply: true,
          supplyKind: 'preparation',
          locale,
          request,
        })
        await sendPurchaseConfirmationEmail({
          type: 'custom-course',
          transactionId: `custom-${courseRequest.id}`,
          userEmail: courseRequest.user.email,
          userName: `${courseRequest.user.first_name} ${courseRequest.user.last_name || ''}`.trim(),
          locale: 'en',
          invoiceNumber: orderRef,
          orderRef,
          productName: `Custom course (PDF): ${data.goalsFreeText.substring(0, 50)}${data.goalsFreeText.length > 50 ? '...' : ''}`,
          deliveryEstimate: `By ${estimatedReadyAt.toLocaleDateString('en-GB', { dateStyle: 'medium' })} (within 2–4 days), by email and in your dashboard`,
          tokens: -tokensCost,
          amountGbp: 0,
          customCourseDeliveryInfo: true,
          consent: { recordedAt: consent.created_at, immediateSupply: true, supplyKind: 'preparation' },
        })
      } catch (consentError) {
        console.error('[Custom Course API] Failed to record consent or send confirmation:', {
          courseRequestId: courseRequest.id,
          error: consentError instanceof Error ? consentError.message : String(consentError),
        })
      }
    }

    // Step 4: Send Inngest events (one per job)
    const requestedAt = new Date().toISOString()
    const inngestEvents = courseRequests.map((courseRequest) => ({
      id: `custom_course/requested:${courseRequest.id}`, // Dedupe: prevents duplicate events for 24h
      name: 'custom_course/requested' as const,
      data: {
        jobId: courseRequest.id,
        userId,
        language: courseRequest.language as 'en' | 'ar',
        requestedAt,
        experienceYears: data.experienceYears,
        depositBudget: data.depositBudget,
        riskTolerance: data.riskTolerance,
        markets: data.markets,
        tradingStyle: data.tradingStyle,
        timeCommitment: data.timeCommitment,
        goalsFreeText: data.goalsFreeText,
        additionalNotes: data.additionalNotes,
        tokensCost,
        userEmail: courseRequest.user.email,
      } as CustomCourseRequestedEvent,
    }))

    let inngestQueued = false
    try {
      await Promise.all(
        inngestEvents.map((event) => inngest.send(event))
      )
      inngestQueued = true
    } catch (inngestError) {
      console.warn('[Custom Course API] Inngest event send failed (non-fatal):', {
        courseRequestIds: courseRequests.map((r) => r.id),
        userId,
        error: inngestError instanceof Error ? inngestError.message : String(inngestError),
        hint: 'If running locally, start the Inngest dev server: npx inngest-cli@latest dev -u http://localhost:3001/api/inngest',
      })
    }

    // Step 5: Return response with jobs array
    const jobs = courseRequests.map((courseRequest) => ({
      jobId: courseRequest.id,
      language: courseRequest.language,
    }))

    // Backward-compatible: if single job, also include top-level jobId
    const singleJob = jobs.length === 1 ? jobs[0] : null

    return NextResponse.json({
      success: true,
      ok: true,
      jobs,
      ...(singleJob && {
        id: singleJob.jobId,
        jobId: singleJob.jobId,
      }),
      status: 'in_queue',
      message: inngestQueued
        ? `Course generation queued for ${jobs.length} language(s). You can close this window.`
        : `Course request created for ${jobs.length} language(s). Background processing could not be started — generation will begin when the job queue is available.`,
      estimatedReadyAt: estimatedReadyAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Custom Course API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


