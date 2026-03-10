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
  requestedCurrency: string
  providerCurrency: string
  providerAmount: number
  totalTokens: number
  bonusPercent: number
  itemSlugs: string[]
}

type ArmenotechInitResult = {
  redirectUrl: string
  transactionId: string | null
  rawResponse: unknown
}

type CallbackResult = {
  ok: boolean
  referenceId?: string
  state?: PaymentState
  topupId?: number | null
  createdTopup?: boolean
  error?: string
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

type ProviderStatusSnapshot = {
  transactionId: string | null
  referenceId: string | null
  state: PaymentState
  amount: number | null
  currency: string | null
  rawResponse: unknown
}

const ISO_CURRENCY_PREFIX = 'iso4217:'
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

function getConfiguredGatewayCurrencies(): string[] {
  return Object.entries(config.armenotech.methods)
    .filter(([, methodGuid]) => Boolean(methodGuid))
    .map(([currency]) => currency)
}

function getProviderCurrency(requestedCurrency: string): string {
  const requested = normalizeCurrency(requestedCurrency)
  const supported = getConfiguredGatewayCurrencies()

  if (supported.includes(requested)) {
    return requested
  }

  if (supported.includes('USD')) {
    return 'USD'
  }

  if (supported.includes('EUR')) {
    return 'EUR'
  }

  if (supported.length > 0) {
    return supported[0]
  }

  throw new Error('Armenotech payment methods are not configured')
}

function toIsoCurrency(currency: string): string {
  return `${ISO_CURRENCY_PREFIX}${normalizeCurrency(currency)}`
}

function stripIsoCurrencyPrefix(value: string): string {
  return normalizeCurrency(String(value || '').replace(ISO_CURRENCY_PREFIX, ''))
}

function extractTransactionIdFromRedirectUrl(redirectUrl: string): string | null {
  try {
    const url = new URL(redirectUrl)
    const parts = url.pathname.split('/').filter(Boolean)
    return parts.at(-1) || null
  } catch {
    return null
  }
}

function getMethodGuid(currency: string): string {
  const methodGuid = config.armenotech.methods[normalizeCurrency(currency) as 'USD' | 'EUR']
  if (!methodGuid) {
    throw new Error(`No Armenotech payment method configured for ${currency}`)
  }
  return methodGuid
}

function ensureGatewayConfig() {
  if (!config.armenotech.apiUrl) {
    throw new Error('ARMENOTECH_API_URL is not configured')
  }
  if (!config.armenotech.merchantGuid) {
    throw new Error('ARMENOTECH_MERCHANT_GUID is not configured')
  }
  if (!config.armenotech.appToken || !config.armenotech.appSecret) {
    throw new Error('Armenotech app credentials are not configured')
  }
  if (!config.armenotech.callbackSecret) {
    throw new Error('ARMENOTECH_CALLBACK_SECRET is not configured')
  }
}

function buildInitRequestBody(input: {
  amount: number
  currency: string
  referenceId: string
  methodGuid: string
  redirectUrl: string
  callbackUrl: string
  payerId: string
  payerEmail?: string | null
  customerIpAddress?: string | null
  refererDomain?: string | null
}) {
  const normalizedCurrency = normalizeCurrency(input.currency)
  const isoCurrency = toIsoCurrency(input.currency)

  return {
    amount: input.amount,
    currency: normalizedCurrency,
    body_currency: isoCurrency,
    fields: {
      transaction: {
        deposit_method: input.methodGuid,
        deposit: {
          redirect_url: input.redirectUrl,
          status_callback_url: input.callbackUrl,
          external_id: input.referenceId,
          merchant_external_id: input.referenceId,
          currency: normalizedCurrency,
          body_currency: isoCurrency,
          payer_id: input.payerId,
          from_email: input.payerEmail || undefined,
          customer_ip_address: input.customerIpAddress || undefined,
          referer_domain: input.refererDomain || undefined,
        },
      },
    },
  }
}

function extractStringByKey(value: unknown, keyNames: string[]): string | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = extractStringByKey(item, keyNames)
      if (match) return match
    }
    return null
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (keyNames.includes(key) && typeof nestedValue === 'string' && nestedValue.trim()) {
      return nestedValue
    }
    const nestedMatch = extractStringByKey(nestedValue, keyNames)
    if (nestedMatch) return nestedMatch
  }

  return null
}

function findFirstUrl(value: unknown): string | null {
  if (!value) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return /^https?:\/\//i.test(trimmed) ? trimmed : null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findFirstUrl(item)
      if (match) return match
    }
    return null
  }

  if (typeof value === 'object') {
    for (const nestedValue of Object.values(value)) {
      const match = findFirstUrl(nestedValue)
      if (match) return match
    }
  }

  return null
}

function toErrorPreview(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 500)
  } catch {
    return String(value).slice(0, 500)
  }
}

async function createArmenotechDepositSession(input: {
  amount: number
  currency: string
  referenceId: string
  methodGuid: string
  redirectUrl: string
  callbackUrl: string
  payerId: string
  payerEmail?: string | null
  customerIpAddress?: string | null
  refererDomain?: string | null
}): Promise<ArmenotechInitResult> {
  ensureGatewayConfig()

  const baseUrl = config.armenotech.apiUrl.replace(/\/$/, '')
  const endpoint = `${baseUrl}/api/v3/${config.armenotech.merchantGuid}/transactions`
  const body = buildInitRequestBody(input)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Token': config.armenotech.appToken,
      'X-App-Secret': config.armenotech.appSecret,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  let responseBody: unknown = null
  try {
    responseBody = await response.json()
  } catch {
    responseBody = await response.text().catch(() => null)
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Armenotech authentication failed while creating a payment session')
    }

    throw new Error(
      `Failed to create Armenotech payment session (status ${response.status}): ${toErrorPreview(responseBody)}`
    )
  }

  const redirectUrl =
    extractStringByKey(responseBody, [
      'how',
      'redirect_url',
      'redirectUrl',
      'payment_url',
      'paymentUrl',
      'checkout_url',
      'checkoutUrl',
      'hosted_url',
      'hostedUrl',
      'url',
      'link',
    ]) || findFirstUrl(responseBody)

  if (!redirectUrl) {
    throw new Error(`Armenotech session created without redirect URL: ${toErrorPreview(responseBody)}`)
  }

  const transactionId = extractStringByKey(responseBody, [
    'transaction_id',
    'transactionId',
    'external_transaction_id',
    'id',
    'payment_id',
    'paymentId',
  ]) || extractTransactionIdFromRedirectUrl(redirectUrl)

  return {
    redirectUrl,
    transactionId,
    rawResponse: responseBody,
  }
}

function mapCallbackState(payload: Record<string, unknown>): PaymentState {
  const status = String(payload.status || '').toLowerCase()
  const fiscalStatus = String(payload.fiscal_status || '').toLowerCase()
  const sep31Status = String(payload.sep31_status || '').toLowerCase()
  const refunded = payload.refunded === true || String(payload.refunded).toLowerCase() === 'true'

  if (refunded || status === 'refunded') return 'REFUNDED'
  if ((status === 'done' || status === 'completed' || status === 'success') && sep31Status === 'completed') {
    return 'COMPLETED'
  }
  if ((fiscalStatus === 'done' || fiscalStatus === 'completed') && sep31Status === 'completed') {
    return 'COMPLETED'
  }
  if (status === 'pending' || fiscalStatus === 'pending') return 'PENDING'
  if (status === 'canceled' || status === 'cancelled' || fiscalStatus === 'cancelled') return 'CANCELLED'
  if (status === 'expired' || fiscalStatus === 'expired') return 'EXPIRED'
  if (status === 'failed' || fiscalStatus === 'failed' || sep31Status === 'error') return 'FAILED'
  return 'PENDING'
}

function compareAmounts(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(a - b) <= tolerance
}

function normalizeProviderPayload(rawBody: unknown): Record<string, unknown> | null {
  if (!rawBody) return null

  if (typeof rawBody === 'string') {
    const trimmed = rawBody.trim()
    if (!trimmed) return null

    try {
      return normalizeProviderPayload(JSON.parse(trimmed))
    } catch {
      const params = new URLSearchParams(trimmed)
      if ([...params.keys()].length > 0) {
        const obj = Object.fromEntries(params.entries())
        if (typeof obj.payload === 'string') {
          try {
            return normalizeProviderPayload(JSON.parse(obj.payload))
          } catch {
            return obj
          }
        }
        return obj
      }

      return null
    }
  }

  if (Array.isArray(rawBody)) {
    return null
  }

  if (typeof rawBody === 'object') {
    const objectBody = rawBody as Record<string, unknown>
    if (typeof objectBody.payload === 'string') {
      try {
        return normalizeProviderPayload(JSON.parse(objectBody.payload))
      } catch {
        return objectBody
      }
    }
    if (objectBody.payload && typeof objectBody.payload === 'object' && !Array.isArray(objectBody.payload)) {
      return objectBody.payload as Record<string, unknown>
    }
    return objectBody
  }

  return null
}

function extractProviderAmount(payload: Record<string, unknown>, fallbackAmount: number): number {
  for (const candidate of [payload.amount_in, payload.amount_body, payload.amount, payload.amount_out]) {
    const amount = Number(candidate)
    if (Number.isFinite(amount) && amount > 0) {
      return amount
    }
  }

  return fallbackAmount
}

function extractProviderCurrency(payload: Record<string, unknown>, fallbackCurrency: string): string {
  for (const candidate of [payload.body_currency, payload.currency, payload.delivery_currency, payload.asset]) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue
    const normalized = stripIsoCurrencyPrefix(candidate.split(':').at(-1) || candidate)
    if (normalized) {
      return normalized
    }
  }

  return normalizeCurrency(fallbackCurrency)
}

async function fetchArmenotechTransactionStatus(input: {
  paymentId?: string | null
  referenceId: string
}): Promise<ProviderStatusSnapshot | null> {
  ensureGatewayConfig()

  const baseUrl = config.armenotech.apiUrl.replace(/\/$/, '')
  const merchantGuid = config.armenotech.merchantGuid
  const candidates = [
    input.paymentId ? `${baseUrl}/api/v3/${merchantGuid}/transactions/${encodeURIComponent(input.paymentId)}` : null,
    input.paymentId ? `${baseUrl}/api/v3/${merchantGuid}/transactions/${encodeURIComponent(input.paymentId)}/status` : null,
    input.paymentId ? `${baseUrl}/api/v3/${merchantGuid}/transaction/${encodeURIComponent(input.paymentId)}` : null,
    `${baseUrl}/api/v3/${merchantGuid}/transactions?external_id=${encodeURIComponent(input.referenceId)}`,
    `${baseUrl}/api/v3/${merchantGuid}/transactions?merchant_external_id=${encodeURIComponent(input.referenceId)}`,
  ].filter(Boolean) as string[]

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-App-Token': config.armenotech.appToken,
          'X-App-Secret': config.armenotech.appSecret,
        },
        cache: 'no-store',
      })

      if (response.status === 404 || response.status === 405) {
        continue
      }

      let rawResponse: unknown = null
      try {
        rawResponse = await response.json()
      } catch {
        rawResponse = await response.text().catch(() => null)
      }

      if (!response.ok) {
        continue
      }

      const payload = normalizeProviderPayload(rawResponse)
      if (!payload) {
        continue
      }

      return {
        transactionId:
          extractStringByKey(payload, ['transaction_id', 'transactionId', 'id', 'payment_id', 'paymentId']) ||
          input.paymentId ||
          null,
        referenceId:
          extractStringByKey(payload, ['merchant_external_id', 'external_id', 'reference_id']) || input.referenceId,
        state: mapCallbackState(payload),
        amount: extractProviderAmount(payload, NaN),
        currency: extractProviderCurrency(payload, ''),
        rawResponse,
      }
    } catch {
      continue
    }
  }

  return null
}

async function finalizeTopupFromProvider(input: {
  payment: {
    id: number
    reference_id: string
    payment_id: string | null
    topup_id: number | null
    user_id: number
    amount: unknown
    currency: string
    tokens: number
  }
  providerState: PaymentState
  transactionId?: string | null
  amount?: number | null
  currency?: string | null
  triggerEmail?: boolean
}): Promise<CallbackResult> {
  const providerAmount = input.amount
  const providerCurrency = input.currency ? normalizeCurrency(input.currency) : normalizeCurrency(input.payment.currency)

  if (Number.isFinite(providerAmount) && !compareAmounts(Number(providerAmount), Number(input.payment.amount))) {
    return { ok: false, error: 'Provider amount mismatch', referenceId: input.payment.reference_id, state: input.providerState }
  }

  if (providerCurrency && providerCurrency !== normalizeCurrency(input.payment.currency)) {
    return { ok: false, error: 'Provider currency mismatch', referenceId: input.payment.reference_id, state: input.providerState }
  }

  if (input.providerState !== 'COMPLETED') {
    await prisma.transferMitTopup.update({
      where: { id: input.payment.id },
      data: {
        state: input.providerState,
        payment_id: input.transactionId || input.payment.payment_id || undefined,
      },
    })

    return {
      ok: true,
      referenceId: input.payment.reference_id,
      state: input.providerState,
      topupId: input.payment.topup_id,
      createdTopup: false,
    }
  }

  const completed = await prisma.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: number
        topup_id: number | null
        payment_id: string | null
        user_id: number
        amount: unknown
        currency: string
        tokens: number
      }>
    >`SELECT id, topup_id, payment_id, user_id, amount, currency, tokens FROM "TransferMitTopup" WHERE "reference_id" = ${input.payment.reference_id} FOR UPDATE`

    const locked = lockedRows[0]
    if (!locked) {
      throw new Error('Payment record disappeared during provider reconciliation')
    }

    if (locked.topup_id) {
      const existingUser = await tx.user.findUnique({
        where: { id: locked.user_id },
        select: { balance: true },
      })

      await tx.transferMitTopup.update({
        where: { id: locked.id },
        data: {
          state: 'COMPLETED',
          payment_id: input.transactionId || locked.payment_id || undefined,
        },
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
      data: {
        balance: {
          increment: locked.tokens,
        },
      },
      select: {
        id: true,
        balance: true,
      },
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
        payment_id: input.transactionId || locked.payment_id || undefined,
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
    input.triggerEmail !== false &&
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

  return {
    ok: true,
    referenceId: input.payment.reference_id,
    state: 'COMPLETED',
    topupId: completed.topupId,
    createdTopup: completed.createdTopup,
  }
}

function verifyCallbackSignature(payload: Record<string, unknown>): boolean {
  const transactionId = String(payload.transaction_id || '')
  const sep31Status = String(payload.sep31_status || '')
  const refunded = payload.refunded === true || String(payload.refunded).toLowerCase() === 'true'
  const provided = String(payload.md5_body_sig || '').toLowerCase()

  if (!transactionId || !sep31Status || !provided) {
    return false
  }

  const expected = crypto
    .createHash('md5')
    .update(`${transactionId}${sep31Status}${refunded}${config.armenotech.callbackSecret}`)
    .digest('hex')
    .toLowerCase()

  return expected === provided
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

export async function createHostedTopupSession(input: {
  userId: number
  userEmail?: string | null
  body: unknown
  baseUrl: string
  customerIpAddress?: string | null
}) {
  ensureGatewayConfig()

  const parsed = parseTopupRequest(input.body)
  const referenceId = createTopupReference(input.userId)

  const paymentRecord = await prisma.transferMitTopup.create({
    data: {
      user_id: input.userId,
      reference_id: referenceId,
      amount: parsed.providerAmount,
      currency: parsed.providerCurrency,
      tokens: parsed.totalTokens,
      bonus_percent: parsed.bonusPercent,
      state: 'INITIATED',
    },
  })

  const successUrl = `${input.baseUrl.replace(/\/$/, '')}/top-up/result?reference=${encodeURIComponent(referenceId)}`
  const callbackUrl = `${input.baseUrl.replace(/\/$/, '')}/api/topup/callback`

  try {
    const methodGuid = getMethodGuid(parsed.providerCurrency)
    const providerSession = await createArmenotechDepositSession({
      amount: parsed.providerAmount,
      currency: parsed.providerCurrency,
      referenceId,
      methodGuid,
      redirectUrl: successUrl,
      callbackUrl,
      payerId: String(input.userId),
      payerEmail: input.userEmail,
      customerIpAddress: input.customerIpAddress,
      refererDomain: new URL(input.baseUrl).hostname,
    })

    await prisma.transferMitTopup.update({
      where: { id: paymentRecord.id },
      data: {
        payment_id: providerSession.transactionId || undefined,
        state: 'PENDING',
      },
    })

    return {
      redirectUrl: providerSession.redirectUrl,
      referenceId,
      state: 'PENDING' as PaymentState,
      providerCurrency: parsed.providerCurrency,
      providerAmount: parsed.providerAmount,
      totalTokens: parsed.totalTokens,
    }
  } catch (error) {
    await prisma.transferMitTopup.update({
      where: { id: paymentRecord.id },
      data: {
        state: 'FAILED',
      },
    })

    throw error
  }
}

export async function processArmenotechCallback(rawBody: unknown): Promise<CallbackResult> {
  ensureGatewayConfig()

  const payload = normalizeProviderPayload(rawBody)

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid callback payload' }
  }

  if (!verifyCallbackSignature(payload)) {
    return { ok: false, error: 'Invalid callback signature' }
  }

  const referenceId = String(payload.merchant_external_id || payload.external_id || '').trim()
  if (!referenceId) {
    return { ok: false, error: 'Missing merchant reference' }
  }

  const payment = await prisma.transferMitTopup.findUnique({
    where: { reference_id: referenceId },
  })

  if (!payment) {
    return { ok: false, error: 'Top-up payment record not found', referenceId }
  }

  const state = mapCallbackState(payload)
  const transactionId = String(payload.transaction_id || '').trim() || null
  const callbackAmount = extractProviderAmount(payload, Number(payment.amount))
  const callbackCurrency = extractProviderCurrency(payload, payment.currency)

  return finalizeTopupFromProvider({
    payment,
    providerState: state,
    transactionId,
    amount: callbackAmount,
    currency: callbackCurrency,
    triggerEmail: true,
  })
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
      payment_id: true,
    },
  })

  if (!payment) {
    return { found: false, message: 'Top-up payment not found' }
  }

  let resolvedPayment = payment

  if ((payment.state === 'INITIATED' || payment.state === 'PENDING') && payment.reference_id) {
    const providerStatus = await fetchArmenotechTransactionStatus({
      paymentId: (payment as { payment_id?: string | null }).payment_id || null,
      referenceId: payment.reference_id,
    })

    if (providerStatus) {
      const fullPayment = await prisma.transferMitTopup.findUnique({
        where: { reference_id: payment.reference_id },
      })

      if (fullPayment) {
        await finalizeTopupFromProvider({
          payment: fullPayment,
          providerState: providerStatus.state,
          transactionId: providerStatus.transactionId,
          amount: providerStatus.amount,
          currency: providerStatus.currency,
          triggerEmail: true,
        })

        const refreshedPayment = await prisma.transferMitTopup.findUnique({
          where: { reference_id: payment.reference_id },
          select: {
            reference_id: true,
            state: true,
            amount: true,
            currency: true,
            tokens: true,
            topup_id: true,
            payment_id: true,
          },
        })

        if (refreshedPayment) {
          resolvedPayment = refreshedPayment
        }
      }
    }
  }

  return {
    found: true,
    referenceId: resolvedPayment.reference_id,
    state: resolvedPayment.state as PaymentState,
    amount: Number(resolvedPayment.amount),
    currency: resolvedPayment.currency,
    tokens: resolvedPayment.tokens,
    topupId: resolvedPayment.topup_id,
    receiptAvailable: Boolean(resolvedPayment.topup_id),
    message: getTopupStatusMessage(resolvedPayment.state as PaymentState),
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
      return 'The payment was refunded by the provider.'
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
    const requestedCurrency = normalizeCurrency(cartParsed.data.currency)
    const providerCurrency = getProviderCurrency(requestedCurrency)

    const summedTokens = cartParsed.data.items.reduce((sum, item) => sum + item.tokens, 0)
    const totalTokens = summedTokens > 0 ? summedTokens : cartParsed.data.totalTokens
    const bonusPercent = 0

    const amountGbp = roundMoney(totalTokens / 100)
    const providerAmount = roundMoney(convertAmount(amountGbp, 'GBP', providerCurrency))

    if (!Number.isFinite(providerAmount) || providerAmount <= 0) {
      throw new Error('Invalid provider amount for top-up checkout payload')
    }

    return {
      source: 'checkout',
      requestedCurrency,
      providerCurrency,
      providerAmount,
      totalTokens,
      bonusPercent,
      itemSlugs: cartParsed.data.items.map((i) => i.slug),
    }
  }

  const directParsed = directTopupSchema.safeParse(body)
  if (directParsed.success) {
    const requestedCurrency = normalizeCurrency(directParsed.data.currency)
    const providerCurrency = getProviderCurrency(requestedCurrency)

    const baseTokens = calculateTokens(directParsed.data.amount, requestedCurrency)

    const bonusPercentRaw = (config as any)?.topup?.bonusPercent
    const bonusPercent =
      typeof bonusPercentRaw === 'number' && Number.isFinite(bonusPercentRaw)
        ? Math.max(0, Math.min(100, Math.round(bonusPercentRaw)))
        : 0

    const totalTokens = Math.round(baseTokens * (1 + bonusPercent / 100))
    const providerAmount = roundMoney(
      convertAmount(directParsed.data.amount, requestedCurrency, providerCurrency)
    )

    if (!Number.isFinite(totalTokens) || totalTokens <= 0) {
      throw new Error('Invalid token amount for direct top-up payload')
    }

    if (!Number.isFinite(providerAmount) || providerAmount <= 0) {
      throw new Error('Invalid provider amount for direct top-up payload')
    }

    return {
      source: 'direct',
      requestedCurrency,
      providerCurrency,
      providerAmount,
      totalTokens,
      bonusPercent,
      itemSlugs: [],
    }
  }

  // Fallthrough: invalid payload
  throw new Error('Invalid top-up request payload')
}
