import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import { calculateTokens, convertAmount } from '@/lib/currency-utils'
import { generateReceiptPdf } from '@/lib/receipts/pdf-generator'
import { sendPurchaseConfirmationEmail } from '@/lib/email'
import {
  createMadfinPayment,
  getMadfinPaymentStatus,
  sanitizeCountryCode,
  sanitizeMadfinPhone,
} from '@/lib/madfin-client'
import {
  createCorefyPaymentInvoice,
  getCorefyInvoiceStatus,
  CorefyWebhookPayload,
} from '@/lib/corefy-client'

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

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const useCorefy =
    config.paymentProvider === 'corefy' ||
    (config.paymentProvider === 'auto' && Boolean(config.corefy.accountId && config.corefy.apiKey))

  if (useCorefy) {
    const returnUrl = `${input.baseUrl.replace(/\/$/, '')}/top-up/processing?reference=${encodeURIComponent(referenceId)}`
    const cancelUrl = `${input.baseUrl.replace(/\/$/, '')}/top-up`
    const callbackUrl = `${input.baseUrl.replace(/\/$/, '')}/api/webhooks/corefy`

    const corefyResult = await createCorefyPaymentInvoice({
      amount: parsed.amount,
      currency: parsed.currency,
      referenceId,
      returnUrl,
      cancelUrl,
      callbackUrl,
      serviceCode: config.corefy.serviceCode,
      customer: {
        referenceId: `user_${user.id}`,
        firstName: user.first_name || 'Customer',
        lastName: user.last_name || 'User',
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Customer',
        email: user.email || input.userEmail || '',
        phone: user.phone || '4402072243688',
        address: {
          fullAddress: user.bill_address || '221b Baker St, London',
          street: user.bill_address || '221b Baker St',
          city: user.bill_city || 'London',
          country: sanitizeCountryCode(user.bill_country, 'GB'),
          postalCode: user.bill_postal || 'NW1 6XE',
          region: user.bill_state || '',
        },
      },
      metadata: {
        user_id: String(user.id),
        reference_id: referenceId,
        provider: 'corefy',
      },
    })

    await prisma.transferMitTopup.create({
      data: {
        user_id: input.userId,
        reference_id: referenceId,
        amount: parsed.amount,
        currency: parsed.currency,
        tokens: parsed.totalTokens,
        bonus_percent: parsed.bonusPercent,
        payment_id: corefyResult.invoiceId,
        state: 'INITIATED',
      },
    })

    return {
      redirectUrl: corefyResult.redirectUrl,
      referenceId,
      state: 'INITIATED' as PaymentState,
      testMode: Boolean(config.corefy.testMode),
      providerCurrency: parsed.currency,
      providerAmount: parsed.amount,
      totalTokens: parsed.totalTokens,
    }
  }

  if (config.madfin.apiKey) {
    const returnUrl = `${input.baseUrl.replace(/\/$/, '')}/top-up/processing?reference=${encodeURIComponent(referenceId)}`
    const webhookUrl = `${input.baseUrl.replace(/\/$/, '')}/api/webhooks/madfin`

    const madfinResponse = await createMadfinPayment({
      amount: parsed.amount,
      currency: parsed.currency,
      referenceId,
      returnUrl,
      webhookUrl,
      customer: {
        referenceId: `user_${user.id}`,
        firstName: user.first_name || 'Customer',
        lastName: user.last_name || 'User',
        email: user.email || input.userEmail || '',
        phone: sanitizeMadfinPhone(user.phone),
        citizenshipCountryCode: sanitizeCountryCode(user.citizenship || user.bill_country, 'GB'),
        locale: 'en',
        ...(user.date_of_birth ? { dateOfBirth: user.date_of_birth.toISOString().slice(0, 10) } : {}),
        ...(input.customerIpAddress ? { ip: input.customerIpAddress } : {}),
      },
      billingAddress: {
        addressLine1: user.bill_address || '221b Baker St, Marylebone',
        ...(user.bill_address_2 ? { addressLine2: user.bill_address_2 } : {}),
        city: user.bill_city || 'London',
        countryCode: sanitizeCountryCode(user.bill_country, 'GB'),
        postalCode: user.bill_postal || 'NW1 6XE',
        ...(user.bill_state ? { state: user.bill_state } : {}),
      },
    })

    const result = madfinResponse.result
    const redirectUrl = result?.redirectUrl || returnUrl
    const madfinPaymentId = result?.id || null

    await prisma.transferMitTopup.create({
      data: {
        user_id: input.userId,
        reference_id: referenceId,
        amount: parsed.amount,
        currency: parsed.currency,
        tokens: parsed.totalTokens,
        bonus_percent: parsed.bonusPercent,
        payment_id: madfinPaymentId,
        state: 'INITIATED',
      },
    })

    return {
      redirectUrl,
      referenceId,
      state: 'INITIATED' as PaymentState,
      testMode: false,
      providerCurrency: parsed.currency,
      providerAmount: parsed.amount,
      totalTokens: parsed.totalTokens,
    }
  }

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

  const resultUrl = `${input.baseUrl.replace(/\/$/, '')}/top-up/processing?reference=${encodeURIComponent(referenceId)}`

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
      id: true,
      reference_id: true,
      payment_id: true,
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

  let currentState = payment.state as PaymentState
  let currentTopupId = payment.topup_id

  if (
    !TERMINAL_STATES.includes(currentState) &&
    payment.payment_id &&
    !payment.payment_id.startsWith('test-')
  ) {
    let checkedWithCorefy = false

    // Check with Corefy API if credentials are configured
    if (config.corefy.accountId && config.corefy.apiKey) {
      try {
        const corefyAttrs = await getCorefyInvoiceStatus(payment.payment_id)
        if (corefyAttrs && corefyAttrs.status) {
          checkedWithCorefy = true
          const remoteState = String(corefyAttrs.status).toLowerCase()

          if (remoteState === 'processed') {
            const completed = await creditTopup(payment.reference_id)
            currentState = 'COMPLETED'
            currentTopupId = completed.topupId
          } else if (remoteState === 'process_failed' || remoteState === 'authorize_failed') {
            currentState = 'FAILED'
            await prisma.transferMitTopup.update({
              where: { id: payment.id },
              data: { state: 'FAILED' },
            })
          } else if (remoteState === 'cancelled') {
            currentState = 'CANCELLED'
            await prisma.transferMitTopup.update({
              where: { id: payment.id },
              data: { state: 'CANCELLED' },
            })
          } else if (remoteState === 'expired') {
            currentState = 'EXPIRED'
            await prisma.transferMitTopup.update({
              where: { id: payment.id },
              data: { state: 'EXPIRED' },
            })
          } else if (remoteState === 'refunded') {
            currentState = 'REFUNDED'
            await prisma.transferMitTopup.update({
              where: { id: payment.id },
              data: { state: 'REFUNDED' },
            })
          }
        }
      } catch (error) {
        console.error('[Top-up Payment Flow] Failed to sync status with Corefy API:', error)
      }
    }

    // Fallback to Madfin API if not handled by Corefy
    if (!checkedWithCorefy && config.madfin.apiKey) {
      try {
        const madfinStatus = await getMadfinPaymentStatus(payment.payment_id)
        const remoteState = madfinStatus.result?.state?.toUpperCase()

        if (remoteState === 'COMPLETED' || remoteState === 'AUTHORIZED') {
          const completed = await creditTopup(payment.reference_id)
          currentState = 'COMPLETED'
          currentTopupId = completed.topupId
        } else if (remoteState === 'DECLINED' || remoteState === 'ERROR') {
          currentState = 'FAILED'
          await prisma.transferMitTopup.update({
            where: { id: payment.id },
            data: { state: 'FAILED' },
          })
        } else if (remoteState === 'CANCELLED') {
          currentState = 'CANCELLED'
          await prisma.transferMitTopup.update({
            where: { id: payment.id },
            data: { state: 'CANCELLED' },
          })
        } else if (remoteState === 'EXPIRED') {
          currentState = 'EXPIRED'
          await prisma.transferMitTopup.update({
            where: { id: payment.id },
            data: { state: 'EXPIRED' },
          })
        }
      } catch (error) {
        console.error('[Top-up Payment Flow] Failed to sync status with Madfin API:', error)
      }
    }
  }

  return {
    found: true,
    referenceId: payment.reference_id,
    state: currentState,
    amount: Number(payment.amount),
    currency: payment.currency,
    tokens: payment.tokens,
    topupId: currentTopupId,
    receiptAvailable: Boolean(currentTopupId),
    message: getTopupStatusMessage(currentState),
  }
}

/**
 * Handles incoming webhook payloads from Madfin gateway
 */
export async function processMadfinWebhookPayload(payload: {
  id?: string
  referenceId?: string
  state?: string
  errorCode?: string
  errorMessage?: string
}): Promise<{ success: boolean; message: string }> {
  const madfinId = payload.id
  const referenceId = payload.referenceId
  const stateRaw = String(payload.state || '').toUpperCase()

  if (!madfinId && !referenceId) {
    return { success: false, message: 'Missing payment ID or referenceId in webhook payload' }
  }

  const payment = await prisma.transferMitTopup.findFirst({
    where: {
      OR: [
        ...(madfinId ? [{ payment_id: madfinId }] : []),
        ...(referenceId ? [{ reference_id: referenceId }] : []),
      ],
    },
  })

  if (!payment) {
    return { success: false, message: 'Payment record not found' }
  }

  if (stateRaw === 'COMPLETED' || stateRaw === 'AUTHORIZED') {
    await creditTopup(payment.reference_id)
    return { success: true, message: 'Payment completed and credited successfully' }
  }

  if (stateRaw === 'DECLINED' || stateRaw === 'ERROR') {
    await prisma.transferMitTopup.update({
      where: { id: payment.id },
      data: { state: 'FAILED' },
    })
    return { success: true, message: 'Payment marked as failed' }
  }

  if (stateRaw === 'CANCELLED') {
    await prisma.transferMitTopup.update({
      where: { id: payment.id },
      data: { state: 'CANCELLED' },
    })
    return { success: true, message: 'Payment marked as cancelled' }
  }

  if (stateRaw === 'EXPIRED') {
    await prisma.transferMitTopup.update({
      where: { id: payment.id },
      data: { state: 'EXPIRED' },
    })
    return { success: true, message: 'Payment marked as expired' }
  }

  return { success: true, message: `Payment state updated to ${stateRaw}` }
}

/**
 * Handles incoming webhook payloads from Corefy / Sterling Pay gateway
 */
export async function processCorefyWebhookPayload(
  payload: CorefyWebhookPayload
): Promise<{ success: boolean; message: string }> {
  const invoiceId = payload.data?.id
  let attributes = payload.data?.attributes || {}
  const metadata = attributes.metadata || {}
  const referenceId = metadata.reference_id || attributes.reference_id

  if (!invoiceId && !referenceId) {
    return { success: false, message: 'Missing invoice ID and reference_id in Corefy webhook payload' }
  }

  const payment = await prisma.transferMitTopup.findFirst({
    where: {
      OR: [
        ...(invoiceId ? [{ payment_id: invoiceId }] : []),
        ...(referenceId ? [{ reference_id: referenceId }] : []),
      ],
    },
  })

  if (!payment) {
    return {
      success: false,
      message: `Payment record not found for Corefy invoice ${invoiceId || 'N/A'} / reference ${referenceId || 'N/A'}`,
    }
  }

  // Double-check real invoice status via Corefy API for 100% security
  if (invoiceId && config.corefy.accountId && config.corefy.apiKey) {
    try {
      const apiStatus = await getCorefyInvoiceStatus(invoiceId)
      if (apiStatus) {
        attributes = apiStatus
      }
    } catch (err) {
      console.warn('[Corefy Webhook] Could not double-check invoice status via API:', err)
    }
  }

  const status = String(attributes.status || '').toLowerCase()
  const resolution = attributes.resolution || ''

  console.log('[Corefy Webhook] Processing invoice transition:', {
    referenceId: payment.reference_id,
    invoiceId,
    status,
    resolution,
  })

  if (status === 'processed') {
    await creditTopup(payment.reference_id)
    return { success: true, message: 'Payment confirmed by Corefy and credited successfully' }
  }

  if (status === 'process_failed' || status === 'authorize_failed') {
    await prisma.transferMitTopup.update({
      where: { id: payment.id },
      data: { state: 'FAILED' },
    })
    return { success: true, message: `Payment failed in Corefy (resolution: ${resolution || status})` }
  }

  if (status === 'cancelled') {
    await prisma.transferMitTopup.update({
      where: { id: payment.id },
      data: { state: 'CANCELLED' },
    })
    return { success: true, message: 'Payment cancelled in Corefy' }
  }

  if (status === 'expired') {
    await prisma.transferMitTopup.update({
      where: { id: payment.id },
      data: { state: 'EXPIRED' },
    })
    return { success: true, message: 'Payment expired in Corefy' }
  }

  if (status === 'refunded') {
    await prisma.transferMitTopup.update({
      where: { id: payment.id },
      data: { state: 'REFUNDED' },
    })
    return { success: true, message: 'Payment marked as refunded in Corefy' }
  }

  return { success: true, message: `Corefy notification recorded with status: ${status}` }
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
