// app/api/topup/route.ts - API endpoint for token top-up purchases

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { sendPurchaseConfirmationEmail } from '@/lib/email'
import { generateReceiptPdf } from '@/lib/receipts/pdf-generator'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const topupSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      tokens: z.number().int().positive(),
      price_gbp: z.number().positive(),
    })
  ),
  currency: z.string(),
  totalTokens: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('[Topup API] Unauthorized: No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    if (isNaN(userId)) {
      console.error('[Topup API] Invalid user ID:', session.user.id)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('[Topup API] JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', message: parseError.message },
        { status: 400 }
      )
    }

    const validationResult = topupSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[Topup API] Validation error:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Validate that all items are token packs or custom top-up
    const invalidItems = data.items.filter(
      (item) =>
        !item.slug.startsWith('token-pack-') && !item.slug.startsWith('custom-top-up')
    )

    if (invalidItems.length > 0) {
      console.error('[Topup API] Invalid items found:', invalidItems)
      return NextResponse.json(
        { error: 'Invalid items: only token packs and custom top-up are allowed' },
        { status: 400 }
      )
    }

    // Verify total tokens matches sum of items
    const calculatedTotal = data.items.reduce((sum, item) => sum + item.tokens, 0)
    if (calculatedTotal !== data.totalTokens) {
      console.error('[Topup API] Token mismatch:', { calculatedTotal, provided: data.totalTokens })
      return NextResponse.json(
        { error: 'Token total mismatch', calculated: calculatedTotal, provided: data.totalTokens },
        { status: 400 }
      )
    }

    // Get current user balance
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      })
    } catch (dbError: any) {
      console.error('[Topup API] Database error fetching user:', {
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
      console.error('[Topup API] User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate total amount in GBP (round to 2 decimal places for Decimal type)
    const totalAmountGbp = data.items.reduce((sum, item) => {
      const itemPrice = Number(item.price_gbp)
      if (isNaN(itemPrice) || itemPrice < 0) {
        throw new Error(`Invalid price_gbp for item ${item.slug}: ${item.price_gbp}`)
      }
      return sum + itemPrice
    }, 0)
    
    // Round to 2 decimal places for Decimal(10, 2)
    const roundedAmountGbp = Math.round(totalAmountGbp * 100) / 100

    console.log('[Topup API] Processing top-up:', {
      userId,
      totalTokens: data.totalTokens,
      totalAmountGbp: roundedAmountGbp,
      itemsCount: data.items.length,
    })

    // Update user balance (increment tokens)
    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: data.totalTokens,
          },
        },
        select: {
          id: true,
          balance: true,
        },
      })
    } catch (updateError: any) {
      console.error('[Topup API] Database error updating user balance:', {
        userId,
        tokensToAdd: data.totalTokens,
        error: updateError.message,
        code: updateError.code,
      })
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to update user balance' },
        { status: 500 }
      )
    }

    // Create top-up record for history
    let topupRecord
    try {
      topupRecord = await prisma.topup.create({
        data: {
          user_id: userId,
          amount: roundedAmountGbp, // Prisma will handle Decimal conversion
          tokens: data.totalTokens,
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
    } catch (createError: any) {
      console.error('[Topup API] Database error creating topup record:', {
        userId,
        amount: roundedAmountGbp,
        tokens: data.totalTokens,
        error: createError.message,
        code: createError.code,
      })
      // If topup record creation fails, we should rollback the balance update
      // But for now, we'll just log the error and continue
      // In production, consider using a transaction
      console.warn('[Topup API] Warning: Topup record creation failed, but balance was updated')
    }

    // Send email confirmation with invoice (non-blocking)
    if (topupRecord) {
      try {
        // Get locale from cookie
        const cookieStore = await cookies()
        const userLocale = cookieStore.get('user_locale')?.value || 'en'
        const locale = (userLocale === 'ar' ? 'ar' : 'en') as 'en' | 'ar'

        // Generate invoice PDF
        const invoiceNumber = `INV-${topupRecord.created_at.getFullYear()}-${topupRecord.id.toString().padStart(6, '0')}`
        const receiptData = {
          id: `topup-${topupRecord.id}`,
          type: 'Top-up',
          invoiceNumber,
          date: topupRecord.created_at,
          amount: Number(topupRecord.amount),
          tokens: topupRecord.tokens,
          description: topupRecord.tokens > 0 ? 'Token pack purchase' : 'Custom top-up',
          user: topupRecord.user,
        }

        const invoicePdfBuffer = await generateReceiptPdf(receiptData)

        // Send email (with or without PDF attachment)
        await sendPurchaseConfirmationEmail({
          type: 'topup',
          transactionId: `topup-${topupRecord.id}`,
          userEmail: topupRecord.user.email,
          userName: `${topupRecord.user.first_name} ${topupRecord.user.last_name || ''}`.trim(),
          locale,
          invoicePdfBuffer: invoicePdfBuffer ?? undefined, // null -> undefined (no attachment)
          invoiceNumber,
          tokens: topupRecord.tokens,
          amountGbp: Number(topupRecord.amount),
          newBalance: Number(updatedUser.balance),
        })

        if (!invoicePdfBuffer) {
          console.warn('[Topup API] PDF invoice could not be generated, email sent without attachment')
        }

        console.log('[Topup API] Email confirmation sent successfully:', {
          userId,
          transactionId: `topup-${topupRecord.id}`,
          locale,
        })
      } catch (emailError: any) {
        // Log error but don't block the purchase
        console.error('[Topup API] Error sending email confirmation:', {
          userId,
          transactionId: topupRecord ? `topup-${topupRecord.id}` : 'unknown',
          error: emailError.message,
          stack: emailError.stack,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens added successfully',
      newBalance: Number(updatedUser.balance),
      tokensAdded: data.totalTokens,
    })
  } catch (error: any) {
    console.error('[Topup API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { 
        error: 'Failed to process top-up', 
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

