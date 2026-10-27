// app/api/ai-strategy/route.ts - AI Strategy generation API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { getModelForFeature } from '@/lib/openai/client'
import { z } from 'zod'
import { inngest } from '@/inngest/client'
import type { AIStrategyRequestedEvent } from '@/inngest/types'
import { CONSENT_REQUIRED_ERROR, productConsentSchema, recordOrderConsent } from '@/lib/consent'
import { formatOrderRef } from '@/lib/order-status'
import { sendPurchaseConfirmationEmail } from '@/lib/email'
import { LOCALE_COOKIE } from '@/i18n/config'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Base price: €30 = 3,000 tokens
const BASE_PRICE_TOKENS = 3000

// Validation schema
const aiStrategySchema = z.object({
  experienceYears: z.enum(['0', '1-2', '3+']),
  depositBudget: z.string().min(1),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  markets: z.array(z.enum(['Forex', 'Crypto', 'Binary'])).min(1),
  tradingStyle: z.enum(['scalp', 'day', 'swing']),
  timeCommitment: z.string().optional(),
  mainObjective: z.string().min(10).max(1000),
  market: z.string().optional(),
  timeframe: z.string().optional(),
  riskPerTrade: z.string().optional(),
  maxTrades: z.string().optional(),
  instruments: z.string().optional(),
  focus: z.string().optional(),
  detailLevel: z.enum(['quick', 'standard', 'deep']).optional(),
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
    const validationResult = aiStrategySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
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
        select: { balance: true, email: true, first_name: true, last_name: true },
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

    // Step 1: Create job row(s) in Neon - one per language
    const languages = data.languages || ['en']
    
    const strategyRuns = await Promise.all(
      languages.map((lang) =>
        withPrismaRetry(() =>
          prisma.aiStrategyRun.create({
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
              time_commitment: data.timeCommitment,
              main_objective: data.mainObjective,
              language: lang,
              tokens_cost: tokensCost,
              request_payload: {
                market: data.market ?? null,
                timeframe: data.timeframe ?? null,
                riskPerTrade: data.riskPerTrade ?? null,
                maxTrades: data.maxTrades ?? null,
                instruments: data.instruments ?? null,
                focus: data.focus ?? null,
                detailLevel: data.detailLevel ?? null,
              },
              ai_model: getModelForFeature('strategy'),
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
        strategyRuns.map((strategyRun) =>
          withPrismaRetry(() =>
            prisma.aiStrategyRun.update({
              where: { id: strategyRun.id },
              data: {
                status: 'cancelled',
                status_stage: 'error',
                cancelled_at: new Date(),
                status_error: `Token deduction failed: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`,
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
    for (const strategyRun of strategyRuns) {
      const orderRef = formatOrderRef('ai', strategyRun.id)
      try {
        const consent = await recordOrderConsent({
          userId,
          orderType: 'ai_strategy',
          orderRef,
          immediateSupply: true,
          locale,
          request,
        })
        await sendPurchaseConfirmationEmail({
          type: 'ai-strategy',
          transactionId: `ai-${strategyRun.id}`,
          userEmail: user.email,
          userName: `${user.first_name} ${user.last_name || ''}`.trim(),
          locale: 'en',
          invoiceNumber: orderRef,
          orderRef,
          productName: `AI strategy (PDF): ${data.mainObjective.substring(0, 50)}${data.mainObjective.length > 50 ? '...' : ''}`,
          deliveryEstimate: 'Usually within 5 minutes, by email and in your dashboard',
          tokens: -tokensCost,
          amountGbp: 0,
          consent: { recordedAt: consent.created_at, immediateSupply: true },
        })
      } catch (consentError) {
        console.error('[AI Strategy API] Failed to record consent or send confirmation:', {
          strategyRunId: strategyRun.id,
          error: consentError instanceof Error ? consentError.message : String(consentError),
        })
      }
    }

    // Step 4: Send Inngest events (one per job)
    const requestedAt = new Date().toISOString()
    const inngestEvents = strategyRuns.map((strategyRun) => ({
      id: `ai_strategy/requested:${strategyRun.id}`, // Dedupe: prevents duplicate events for 24h
      name: 'ai_strategy/requested' as const,
      data: {
        jobId: strategyRun.id,
        userId,
        language: strategyRun.language as 'en' | 'ar',
        requestedAt,
        experienceYears: data.experienceYears,
        depositBudget: data.depositBudget,
        riskTolerance: data.riskTolerance,
        markets: data.markets,
        tradingStyle: data.tradingStyle,
        timeCommitment: data.timeCommitment,
        mainObjective: data.mainObjective,
        market: data.market,
        timeframe: data.timeframe,
        riskPerTrade: data.riskPerTrade,
        maxTrades: data.maxTrades,
        instruments: data.instruments,
        focus: data.focus,
        detailLevel: data.detailLevel,
        tokensCost,
      } as AIStrategyRequestedEvent,
    }))

    let inngestQueued = false
    try {
      await Promise.all(
        inngestEvents.map((event) => inngest.send(event))
      )
      inngestQueued = true
    } catch (inngestError) {
      console.warn('[AI Strategy API] Inngest event send failed (non-fatal):', {
        strategyRunIds: strategyRuns.map((r) => r.id),
        userId,
        error: inngestError instanceof Error ? inngestError.message : String(inngestError),
        hint: 'If running locally, start the Inngest dev server: npx inngest-cli@latest dev -u http://localhost:3001/api/inngest',
      })
    }

    // Step 5: Return response with jobs array
    const jobs = strategyRuns.map((strategyRun) => ({
      jobId: strategyRun.id,
      language: strategyRun.language,
    }))

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
        ? `Strategy generation queued for ${jobs.length} language(s). You can close this window.`
        : `Strategy request created for ${jobs.length} language(s). Background processing could not be started — generation will begin when the job queue is available.`,
    })
  } catch (error) {
    console.error('AI Strategy API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


