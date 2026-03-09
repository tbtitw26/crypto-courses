// app/api/transactions/route.ts - API endpoint for user transaction history

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TopupRecord = {
  id: number
  tokens: number | null
  amount: Prisma.Decimal | null
  created_at: Date
}

type PendingTopupRecord = {
  id: number
  reference_id: string
  tokens: number
  amount: Prisma.Decimal
  currency: string
  state: string
  created_at: Date
}

type CustomCourseRecord = {
  id: number
  tokens_cost: number
  status: string
  markets: string[]
  created_at: Date
}

type AiStrategyRecord = {
  id: number
  tokens_cost: number
  status: string
  markets: string[]
  created_at: Date
}

type CoursePurchaseRecord = {
  id: number
  tokens_cost: number
  amount_gbp: Prisma.Decimal | null
  created_at: Date
  course: {
    title: string
    slug: string
    market: string
    level: string
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('[Transactions API] Unauthorized: No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    if (isNaN(userId)) {
      console.error('[Transactions API] Invalid user ID:', session.user.id)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[Transactions API] Fetching transactions:', { userId, limit, offset })

    // Fetch all transaction types with error handling
    let topups: TopupRecord[] = []
    let pendingTopups: PendingTopupRecord[] = []
    let customCourses: CustomCourseRecord[] = []
    let aiStrategies: AiStrategyRecord[] = []
    let coursePurchases: CoursePurchaseRecord[] = []

    try {
      // Fetch topups, custom courses, and AI strategies with retry logic
      ;[topups, pendingTopups, customCourses, aiStrategies] = await Promise.all([
        // Top-ups (token purchases)
        withPrismaRetry(() =>
          prisma.topup.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              tokens: true,
              amount: true,
              created_at: true,
            },
          })
        ),
        withPrismaRetry(() =>
          prisma.transferMitTopup.findMany({
            where: {
              user_id: userId,
              topup_id: null,
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              reference_id: true,
              tokens: true,
              amount: true,
              currency: true,
              state: true,
              created_at: true,
            },
          })
        ),
        // Custom course purchases (token deductions)
        withPrismaRetry(() =>
          prisma.customCourseRequest.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              tokens_cost: true,
              status: true,
              markets: true,
              created_at: true,
            },
          })
        ),
        // AI strategy purchases (token deductions)
        withPrismaRetry(() =>
          prisma.aiStrategyRun.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              tokens_cost: true,
              status: true,
              markets: true,
              created_at: true,
            },
          })
        ),
      ])

      // Fetch course purchases separately (handle case where model doesn't exist in Prisma Client yet)
      try {
        coursePurchases = await withPrismaRetry(() =>
          prisma.coursePurchase.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
            select: {
              id: true,
              tokens_cost: true,
              amount_gbp: true,
              created_at: true,
              course: {
                select: {
                  title: true,
                  slug: true,
                  market: true,
                  level: true,
                },
              },
            },
          })
        )
      } catch (coursePurchaseError: any) {
        // Handle case where CoursePurchase model doesn't exist in Prisma Client yet
        if (coursePurchaseError.message?.includes('coursePurchase') || coursePurchaseError.code === 'P2001') {
          console.warn('[Transactions API] CoursePurchase model not available yet, skipping')
          coursePurchases = []
        } else {
          throw coursePurchaseError
        }
      }
    } catch (dbError: any) {
      console.error('[Transactions API] Database error fetching transactions:', {
        userId,
        error: dbError.message,
        code: dbError.code,
        name: dbError.name,
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Transform to unified transaction format
    let transactions
    try {
      transactions = [
        // Top-ups (positive amounts)
        ...topups.map((topup) => {
          const tokens = topup.tokens || 0
          // Calculate tokens from amount if tokens is 0 (for old records)
          // Assuming 1 GBP = 100 tokens for backward compatibility
          const calculatedTokens =
            tokens === 0 && topup.amount ? Math.round(Number(topup.amount) * 100) : tokens

          // Safely convert Decimal to number
          const amountGbp = topup.amount ? Number(topup.amount) : 0

          return {
            id: `topup-${topup.id}`,
            type: 'Top-up',
            detail: calculatedTokens > 0 ? `Token pack purchase` : 'Custom top-up',
            date: topup.created_at.toISOString(),
            tokens: calculatedTokens,
            amount: amountGbp, // Amount in GBP for currency conversion
            meta: `${calculatedTokens.toLocaleString('en-US')} tokens`,
            status: 'Completed',
            receiptAvailable: true,
          }
        }),
        ...pendingTopups.map((topup) => ({
          id: `payment-${topup.id}`,
          type: 'Top-up',
          detail: 'Hosted token top-up',
          date: topup.created_at.toISOString(),
          tokens: topup.tokens,
          amount: 0,
          meta: `${topup.tokens.toLocaleString('en-US')} tokens · ${topup.amount.toFixed(2)} ${topup.currency}`,
          status:
            topup.state === 'COMPLETED'
              ? 'Completed'
              : topup.state === 'FAILED' || topup.state === 'CANCELLED' || topup.state === 'EXPIRED' || topup.state === 'REFUNDED'
              ? 'Failed'
              : 'Pending',
          receiptAvailable: false,
        })),
        // Custom courses (negative amounts)
        ...customCourses.map((course) => ({
          id: `custom-${course.id}`,
          type: 'Custom course',
          detail: `Custom course request`,
          date: course.created_at.toISOString(),
          tokens: -course.tokens_cost,
          amount: 0, // Paid with tokens, not fiat
          meta: `${course.markets.join(', ')} · ${course.status}`,
          status: course.status === 'failed' ? 'Failed' : 'Completed',
          receiptAvailable: true,
        })),
        // AI strategies (negative amounts)
        ...aiStrategies.map((strategy) => ({
          id: `ai-${strategy.id}`,
          type: 'AI strategy',
          detail: `AI strategy generation`,
          date: strategy.created_at.toISOString(),
          tokens: -strategy.tokens_cost,
          amount: 0, // Paid with tokens, not fiat
          meta: `${strategy.markets.join(', ')} · ${strategy.status}`,
          status: strategy.status === 'failed' ? 'Failed' : 'Completed',
          receiptAvailable: true,
        })),
        // Course purchases (negative amounts)
        ...coursePurchases.map((purchase) => ({
          id: `course-${purchase.id}`,
          type: 'Course purchase',
          detail: purchase.course.title,
          date: purchase.created_at.toISOString(),
          tokens: -purchase.tokens_cost,
          amount: Number(purchase.amount_gbp), // Usually 0, but stored for consistency
          meta: `${purchase.course.level} · ${purchase.course.market}`,
          status: 'Completed',
          receiptAvailable: true,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
    } catch (transformError: any) {
      console.error('[Transactions API] Error transforming transactions:', {
        error: transformError.message,
        stack: transformError.stack,
      })
      return NextResponse.json(
        { error: 'Processing error', message: 'Failed to process transactions' },
        { status: 500 }
      )
    }

    console.log('[Transactions API] Successfully fetched transactions:', {
      userId,
      total: transactions.length,
      topups: topups.length,
      pendingTopups: pendingTopups.length,
      customCourses: customCourses.length,
      aiStrategies: aiStrategies.length,
      coursePurchases: coursePurchases.length,
    })

    return NextResponse.json({
      transactions,
      total: transactions.length,
    })
  } catch (error: any) {
    console.error('[Transactions API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
