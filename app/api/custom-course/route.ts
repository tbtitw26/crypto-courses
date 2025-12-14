// app/api/custom-course/route.ts - Custom Course generation API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { getModelForFeature } from '@/lib/openai/client'
import { z } from 'zod'
import { inngest } from '@/inngest/client'
import type { CustomCourseRequestedEvent } from '@/inngest/types'

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
        { error: 'Insufficient token balance', required: tokensCost, current: balance },
        { status: 402 }
      )
    }

    // Calculate estimated ready time (for testing: set to now, will be changed back to 48-96 hours later)
    const estimatedReadyAt = new Date(Date.now() + 5 * 60 * 1000) // For testing: 5 minutes from now (was: 72 hours)

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
      // If token deduction fails, mark job as failed
      await withPrismaRetry(() =>
        prisma.customCourseRequest.update({
          where: { id: courseRequest.id },
          data: {
            status: 'failed',
            status_stage: 'error',
            status_error: `Token deduction failed: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`,
          },
        })
      )
      return NextResponse.json(
        { error: 'Failed to deduct tokens', message: 'Token deduction failed. Please try again.' },
        { status: 500 }
      )
    }

    // Step 3: Send Inngest events (one per job)
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

    try {
      // Send all events in batch
      await Promise.all(
        inngestEvents.map((event) => inngest.send(event))
      )
    } catch (inngestError) {
      // If Inngest send fails, mark all jobs as failed and refund tokens
      console.error('[Custom Course API] Failed to send Inngest events:', {
        courseRequestIds: courseRequests.map((r) => r.id),
        userId,
        error: inngestError instanceof Error ? inngestError.message : String(inngestError),
      })

      // Mark all jobs as failed
      await Promise.all(
        courseRequests.map((courseRequest) =>
          withPrismaRetry(() =>
            prisma.customCourseRequest.update({
              where: { id: courseRequest.id },
              data: {
                status: 'failed',
                status_stage: 'error',
                status_error: `Failed to enqueue job: ${inngestError instanceof Error ? inngestError.message : String(inngestError)}`,
              },
            })
          )
        )
      )

      // Refund tokens
      try {
        await withPrismaRetry(() =>
          prisma.user.update({
            where: { id: userId },
            data: {
              balance: {
                increment: tokensCost,
              },
            },
          })
        )
      } catch (refundError) {
        console.error('[Custom Course API] Failed to refund tokens after Inngest error:', refundError)
        // Log but don't fail - admin can manually refund if needed
      }

      return NextResponse.json(
        { error: 'Failed to enqueue jobs', message: 'Job creation failed. Tokens have been refunded.' },
        { status: 500 }
      )
    }

    // Step 4: Return response with jobs array
    const jobs = courseRequests.map((courseRequest) => ({
      jobId: courseRequest.id,
      language: courseRequest.language,
    }))

    // Backward-compatible: if single job, also include top-level jobId
    const singleJob = jobs.length === 1 ? jobs[0] : null

    return NextResponse.json({
      success: true,
      ok: true,
      jobs, // New format: array of jobs
      ...(singleJob && {
        id: singleJob.jobId, // Backward-compatible
        jobId: singleJob.jobId, // Backward-compatible
      }),
      status: 'in_queue',
      message: `Course generation queued for ${jobs.length} language(s). You can close this window.`,
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


