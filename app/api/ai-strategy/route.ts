// app/api/ai-strategy/route.ts - AI Strategy generation API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { generateAIStrategyComplete } from '@/lib/pdf/ai-strategy'
import { getModelForFeature } from '@/lib/openai/client'
import { z } from 'zod'
import { sendPurchaseConfirmationEmail, sendCourseDeliveryEmail } from '@/lib/email'
import { generateReceiptPdf } from '@/lib/receipts/pdf-generator'
import { updateAiStrategyStatus } from '@/lib/pdf/ai-strategy-status-tracker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        select: { balance: true },
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

    // Deduct tokens immediately (reserve for this request)
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

    // Create AI Strategy Run record
    const strategyRun = await withPrismaRetry(() =>
      prisma.aiStrategyRun.create({
      data: {
        user_id: userId,
        status: 'processing',
        experience_years: data.experienceYears,
        deposit_budget: data.depositBudget,
        risk_tolerance: data.riskTolerance,
        markets: data.markets,
        trading_style: data.tradingStyle,
        time_commitment: data.timeCommitment,
        main_objective: data.mainObjective,
        language: data.languages[0] || 'en',
        tokens_cost: tokensCost,
        ai_model: getModelForFeature('strategy'),
      },
    }))

    const response = NextResponse.json({
      success: true,
      id: strategyRun.id,
      status: 'processing',
      message: 'Strategy generation started. You can close this window.',
    })

    generateStrategyInBackground(strategyRun.id, data, userId).catch((error) => {
      console.error('[AI Strategy API] Background generation error (unhandled):', error)
    })

    return response
  } catch (error) {
    console.error('AI Strategy API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function generateStrategyInBackground(
  strategyRunId: number,
  data: z.infer<typeof aiStrategySchema>,
  userId: number
) {
  const startedAt = new Date().toISOString()

  try {
    await updateAiStrategyStatus({
      strategyRunId,
      stage: 'generating_en',
      progress: 10,
      message: 'Generating English strategy...',
      startedAt,
    })

    const { logger } = await import('@/lib/pdf/logger')
    await logger.info(`[AI Strategy ${strategyRunId}] Starting generation...`, {
      strategyRunId,
      userId,
      languages: data.languages,
      mainObjective: data.mainObjective.substring(0, 120),
    })

    const result = await generateAIStrategyComplete({
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
      languages: data.languages,
    })

    await updateAiStrategyStatus({
      strategyRunId,
      courseId: result.courseId,
      stage: 'generating_pdf_en',
      progress: 70,
      message: 'Strategy generated, preparing PDFs...',
      warnings: result.warnings,
      intermediateFiles: {
        courseEnJson: 'generated',
        ...(result.courseAr && { courseArJson: 'generated' }),
        coverImage: result.coverImagePath,
        diagrams: result.diagramImagePaths,
      },
    })

    const updatedStrategyRun = await prisma.aiStrategyRun.update({
      where: { id: strategyRunId },
      data: {
        status: 'ready',
        rendered_text: JSON.stringify(result.courseEn),
        ai_response_structured: result.courseEn as any,
        prompt_tokens: result.tokens?.prompt ?? null,
        completion_tokens: result.tokens?.completion ?? null,
        total_tokens: result.tokens?.total ?? null,
        ai_model: result.model ?? getModelForFeature('strategy'),
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

    await updateAiStrategyStatus({
      strategyRunId,
      courseId: result.courseId,
      stage: 'sending_emails',
      progress: 85,
      message: 'Sending emails...',
      warnings: result.warnings,
    })

    try {
      const locale = (data.languages[0] === 'ar' ? 'ar' : 'en') as 'en' | 'ar'
      const invoiceNumber = `INV-${updatedStrategyRun.created_at.getFullYear()}-${updatedStrategyRun.id
        .toString()
        .padStart(6, '0')}`

      const receiptData = {
        id: `ai-${updatedStrategyRun.id}`,
        type: 'AI strategy',
        invoiceNumber,
        date: updatedStrategyRun.created_at,
        amount: 0,
        tokens: -updatedStrategyRun.tokens_cost,
        description: 'AI strategy generation',
        markets: updatedStrategyRun.markets,
        user: updatedStrategyRun.user,
      }

      const invoicePdfBuffer = await generateReceiptPdf(receiptData)

      await sendPurchaseConfirmationEmail({
        type: 'ai-strategy',
        transactionId: `ai-${updatedStrategyRun.id}`,
        userEmail: updatedStrategyRun.user.email,
        userName: `${updatedStrategyRun.user.first_name} ${updatedStrategyRun.user.last_name || ''}`.trim(),
        locale,
        invoicePdfBuffer,
        invoiceNumber,
        tokens: -updatedStrategyRun.tokens_cost,
        amountGbp: 0,
      })
    } catch (emailError: any) {
      console.error('[AI Strategy API] Error sending invoice email:', {
        userId,
        strategyRunId,
        error: emailError.message,
        stack: emailError.stack,
      })
    }

    try {
      const locale = (data.languages[0] === 'ar' ? 'ar' : 'en') as 'en' | 'ar'
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
          type: 'ai-strategy',
          userEmail: updatedStrategyRun.user.email,
          userName: `${updatedStrategyRun.user.first_name} ${updatedStrategyRun.user.last_name || ''}`.trim(),
          locale,
          courseId: result.courseId,
          pdfBuffers,
        })
      } else {
        console.warn('[AI Strategy API] No PDF buffers to send:', {
          userId,
          strategyRunId,
        })
      }
    } catch (emailError: any) {
      console.error('[AI Strategy API] Error sending strategy delivery email:', {
        userId,
        strategyRunId,
        error: emailError.message,
        stack: emailError.stack,
      })
    }

    await updateAiStrategyStatus({
      strategyRunId,
      courseId: result.courseId,
      stage: 'completed',
      progress: 100,
      message: 'Strategy delivered via email',
      warnings: result.warnings,
      completedAt: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await updateAiStrategyStatus({
      strategyRunId,
      stage: 'error',
      progress: 100,
      message: 'Strategy generation failed',
      error: errorMessage,
      completedAt: new Date().toISOString(),
    })

    await prisma.aiStrategyRun.update({
      where: { id: strategyRunId },
      data: {
        status: 'failed',
      },
    })

    console.error('[AI Strategy API] Background generation error:', {
      strategyRunId,
      userId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}

