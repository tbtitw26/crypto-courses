import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import { calculateTokens, convertAmount } from '@/lib/currency-utils'
import { generateReceiptPdf } from '@/lib/receipts/pdf-generator'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

type PaymentState =
  | 'INITIATED'
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'

const cartTopupSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      tokens: z.number().int().positive(),
      price_gbp: z.number().nonnegative(),
    })
  ).min(1),
  currency: z.string().min(3),
  totalTokens: z.number().int().positive(),
})

const directTopupSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3),
})

type ParsedTopupRequest = {
  source: 'checkout' | 'direct'
  currency: string
  amount: number
  totalTokens: number
  bonusPercent: number
  itemSlugs: string[]
}

type StatusResponse = {
  found: boolean
  referenceId?: string
  state?: PaymentState
  amount?: number
  currency?: string
  tokens?: number
  topupId?: number | null
  receiptAvailable?: boolean
  message?: string
}

const TERMINAL_STATES: PaymentState[] = ['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED']

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function createTopupReference(userId: number): string {
  const safeUserId = Number.isFinite(userId) ? Math.max(0, Math.trunc(userId)) : 0
  return `topup-${safeUserId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
}

function normalizeCurrency(currency: string): string {
  return String(currency || '').trim().toUpperCase()
}

/**
 * Credits the tokens and creates the Topup record. Idempotent per reference_id:
 * a row that already carries a topup_id is never credited twice.
 */
async function creditTopup(referenceId: string) {
  const completed = await prisma.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: number
        topup_id: number | null
        user_id: number
        tokens: number
      }>
    >`SELECT id, topup_id, user_id, tokens FROM "TransferMitTopup" WHERE "reference_id" = ${referenceId} FOR UPDATE`

    const locked = lockedRows[0]
    if (!locked) {
      throw new Error('Top-up payment record not found')
    }

    if (locked.topup_id) {
      const existingUser = await tx.user.findUnique({
        where: { id: locked.user_id },
        select: { balance: true },
      })

      return {
        createdTopup: false,
        topupId: locked.topup_id,
        newBalance: Number(existingUser?.balance || 0),
        userId: locked.user_id,
      }
    }

    const updatedUser = await tx.user.update({
      where: { id: locked.user_id },
      data: { balance: { increment: locked.tokens } },
      select: { id: true, balance: true },
    })

    const amountGbp = roundMoney(locked.tokens / 100)

    const topup = await tx.topup.create({
      data: {
        user_id: locked.user_id,
        amount: amountGbp,
        tokens: locked.tokens,
      },
    })

    await tx.transferMitTopup.update({
      where: { id: locked.id },
      data: {
        topup_id: topup.id,
        state: 'COMPLETED',
      },
    })

    return {
      createdTopup: true,
      topupId: topup.id,
      newBalance: Number(updatedUser.balance),
      userId: locked.user_id,
      amountGbp,
      tokens: locked.tokens,
    }
  })

  if (
    completed.createdTopup &&
    completed.topupId &&
    typeof completed.amountGbp === 'number' &&
    typeof completed.tokens === 'number'
  ) {
    void sendTopupConfirmationEmail({
      topupId: completed.topupId,
      userId: completed.userId,
      amountGbp: completed.amountGbp,
      tokens: completed.tokens,
      newBalance: completed.newBalance,
    })
  }

  return completed
}

async function sendTopupConfirmationEmail(input: {
  topupId: number
  userId: number
  amountGbp: number
  tokens: number
  newBalance: number
}) {
  try {
    const topupRecord = await prisma.topup.findUnique({
      where: { id: input.topupId },
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

    if (!topupRecord) {
      return
    }

    const invoiceNumber = `INV-${topupRecord.created_at.getFullYear()}-${topupRecord.id
      .toString()
      .padStart(6, '0')}`

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

    await sendPurchaseConfirmationEmail({
      type: 'topup',
      transactionId: `topup-${topupRecord.id}`,
      userEmail: topupRecord.user.email,
      userName: `${topupRecord.user.first_name} ${topupRecord.user.last_name || ''}`.trim(),
      locale: 'en',
      invoicePdfBuffer: invoicePdfBuffer ?? undefined,
      invoiceNumber,
      tokens: input.tokens,
      amountGbp: input.amountGbp,
      newBalance: input.newBalance,
    })
  } catch (error) {
    console.error('[Top-up Payment Flow] Failed to send confirmation email:', error)
  }
}

/**
 * TEST MODE: no external payment provider. The top-up is settled instantly and
 * the user is sent straight to the result page, which reads the COMPLETED state.
 */
export async function createHostedTopupSession(input: {
  userId: number
  userEmail?: string | null
  body: unknown
  baseUrl: string
  customerIpAddress?: string | null
}) {
  const parsed = parseTopupRequest(input.body)
  const referenceId = createTopupReference(input.userId)

  await prisma.transferMitTopup.create({
    data: {
      user_id: input.userId,
      reference_id: referenceId,
      amount: parsed.amount,
      currency: parsed.currency,
      tokens: parsed.totalTokens,
      bonus_percent: parsed.bonusPercent,
      payment_id: `test-${referenceId}`,
      state: 'INITIATED',
    },
  })

  await creditTopup(referenceId)

  const resultUrl = `${input.baseUrl.replace(/\/$/, '')}/top-up/result?reference=${encodeURIComponent(referenceId)}`

  return {
    redirectUrl: resultUrl,
    referenceId,
    state: 'COMPLETED' as PaymentState,
    testMode: true,
    providerCurrency: parsed.currency,
    providerAmount: parsed.amount,
    totalTokens: parsed.totalTokens,
  }
}

export async function getTopupStatus(referenceId: string, userId?: number): Promise<StatusResponse> {
  const trimmedReference = String(referenceId || '').trim()
  if (!trimmedReference) {
    return { found: false, message: 'Missing top-up reference' }
  }

  const payment = await prisma.transferMitTopup.findFirst({
    where: {
      reference_id: trimmedReference,
      ...(userId ? { user_id: userId } : {}),
    },
    select: {
      reference_id: true,
      state: true,
      amount: true,
      currency: true,
      tokens: true,
      topup_id: true,
    },
  })

  if (!payment) {
    return { found: false, message: 'Top-up payment not found' }
  }

  return {
    found: true,
    referenceId: payment.reference_id,
    state: payment.state as PaymentState,
    amount: Number(payment.amount),
    currency: payment.currency,
    tokens: payment.tokens,
    topupId: payment.topup_id,
    receiptAvailable: Boolean(payment.topup_id),
    message: getTopupStatusMessage(payment.state as PaymentState),
  }
}

export function getTopupStatusMessage(state: PaymentState): string {
  switch (state) {
    case 'COMPLETED':
      return 'Payment completed successfully.'
    case 'PENDING':
    case 'INITIATED':
      return 'Your payment is still processing. This page will update automatically.'
    case 'FAILED':
      return 'The payment failed. Please try again or use a different card.'
    case 'CANCELLED':
      return 'The payment was cancelled before completion.'
    case 'EXPIRED':
      return 'The payment session expired before it was completed.'
    case 'REFUNDED':
      return 'The payment was refunded.'
    default:
      return 'Payment status unavailable.'
  }
}

export function isTerminalTopupState(state?: string | null): boolean {
  return Boolean(state && TERMINAL_STATES.includes(state as PaymentState))
}

function parseTopupRequest(body: unknown): ParsedTopupRequest {
  // Supported payloads:
  // 1) Checkout/cart flow: { items: [{slug,tokens,price_gbp}], currency, totalTokens }
  // 2) Direct topup: { amount, currency }
  const cartParsed = cartTopupSchema.safeParse(body)
  if (cartParsed.success) {
    const currency = normalizeCurrency(cartParsed.data.currency)

    const summedTokens = cartParsed.data.items.reduce((sum, item) => sum + item.tokens, 0)
    const totalTokens = summedTokens > 0 ? summedTokens : cartParsed.data.totalTokens

    const amount = roundMoney(convertAmount(totalTokens / 100, 'GBP', currency))

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid amount for top-up checkout payload')
    }

    return {
      source: 'checkout',
      currency,
      amount,
      totalTokens,
      bonusPercent: 0,
      itemSlugs: cartParsed.data.items.map((i) => i.slug),
    }
  }

  const directParsed = directTopupSchema.safeParse(body)
  if (directParsed.success) {
    const currency = normalizeCurrency(directParsed.data.currency)
    const baseTokens = calculateTokens(directParsed.data.amount, currency)

    const bonusPercentRaw = (config as any)?.topup?.bonusPercent
    const bonusPercent =
      typeof bonusPercentRaw === 'number' && Number.isFinite(bonusPercentRaw)
        ? Math.max(0, Math.min(100, Math.round(bonusPercentRaw)))
        : 0

    const totalTokens = Math.round(baseTokens * (1 + bonusPercent / 100))
    const amount = roundMoney(directParsed.data.amount)

    if (!Number.isFinite(totalTokens) || totalTokens <= 0) {
      throw new Error('Invalid token amount for direct top-up payload')
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid amount for direct top-up payload')
    }

    return {
      source: 'direct',
      currency,
      amount,
      totalTokens,
      bonusPercent,
      itemSlugs: [],
    }
  }

  throw new Error('Invalid top-up request payload')
}
