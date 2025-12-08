// app/api/receipts/[transactionId]/route.ts - API endpoint for receipt data

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { transactionId } = await params

    // Parse transaction ID (format: topup-{id}, custom-{id}, ai-{id}, course-{id})
    const [type, id] = transactionId.split('-')
    const recordId = parseInt(id)

    if (isNaN(recordId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 })
    }

    let transactionData: any = null

    // Fetch transaction data based on type
    if (type === 'topup') {
      const topup = await prisma.topup.findFirst({
        where: {
          id: recordId,
          user_id: userId,
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

      if (topup) {
        transactionData = {
          id: transactionId,
          type: 'Top-up',
          invoiceNumber: `INV-${topup.created_at.getFullYear()}-${topup.id.toString().padStart(6, '0')}`,
          date: topup.created_at,
          amount: Number(topup.amount),
          tokens: topup.tokens,
          description: topup.tokens > 0 ? 'Token pack purchase' : 'Custom top-up',
          user: topup.user,
        }
      }
    } else if (type === 'custom') {
      const customCourse = await prisma.customCourseRequest.findFirst({
        where: {
          id: recordId,
          user_id: userId,
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

      if (customCourse) {
        transactionData = {
          id: transactionId,
          type: 'Custom course',
          invoiceNumber: `INV-${customCourse.created_at.getFullYear()}-${customCourse.id.toString().padStart(6, '0')}`,
          date: customCourse.created_at,
          amount: 0, // Paid with tokens
          tokens: -customCourse.tokens_cost,
          description: 'Custom course request',
          markets: customCourse.markets,
          user: customCourse.user,
        }
      }
    } else if (type === 'ai') {
      const aiStrategy = await prisma.aiStrategyRun.findFirst({
        where: {
          id: recordId,
          user_id: userId,
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

      if (aiStrategy) {
        transactionData = {
          id: transactionId,
          type: 'AI strategy',
          invoiceNumber: `INV-${aiStrategy.created_at.getFullYear()}-${aiStrategy.id.toString().padStart(6, '0')}`,
          date: aiStrategy.created_at,
          amount: 0, // Paid with tokens
          tokens: -aiStrategy.tokens_cost,
          description: 'AI strategy generation',
          markets: aiStrategy.markets,
          user: aiStrategy.user,
        }
      }
    } else if (type === 'course') {
      const coursePurchase = await prisma.coursePurchase.findFirst({
        where: {
          id: recordId,
          user_id: userId,
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
              market: true,
              level: true,
            },
          },
        },
      })

      if (coursePurchase) {
        transactionData = {
          id: transactionId,
          type: 'Course purchase',
          invoiceNumber: `INV-${coursePurchase.created_at.getFullYear()}-${coursePurchase.id.toString().padStart(6, '0')}`,
          date: coursePurchase.created_at,
          amount: Number(coursePurchase.amount_gbp), // Usually 0, but stored for consistency
          tokens: -coursePurchase.tokens_cost,
          description: coursePurchase.course.title,
          markets: [coursePurchase.course.market],
          user: coursePurchase.user,
        }
      }
    }

    if (!transactionData) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transactionData)
  } catch (error: any) {
    console.error('[Receipts API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch receipt data',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

