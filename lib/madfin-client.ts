// lib/madfin-client.ts - Madfin Gateway API Client

import crypto from 'node:crypto'
import { config } from '@/lib/config'

export interface MadfinCustomer {
  referenceId: string
  citizenshipCountryCode?: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  email: string
  phone: string
  locale?: string
  ip?: string
}

export interface MadfinBillingAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  countryCode: string
  postalCode: string
  state?: string
}

export interface CreateMadfinPaymentInput {
  amount: number
  currency: string
  referenceId: string
  webhookUrl?: string
  returnUrl?: string
  customer: MadfinCustomer
  billingAddress: MadfinBillingAddress
}

export interface MadfinPaymentResult {
  id: string
  referenceId?: string
  paymentType: string
  state: 'CHECKOUT' | 'INITIATED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED' | 'AUTHORIZED' | 'ERROR' | string
  currency: string
  amount?: number
  redirectUrl?: string
  errorCode?: string
  errorMessage?: string
  description?: string
  customerAmount?: number
  customerCurrency?: string
}

export interface MadfinCreatePaymentResponse {
  timestamp: string
  status: number
  result?: MadfinPaymentResult
  error?: string
  message?: string
  errors?: Array<{
    field?: string
    defaultMessage?: string
    codes?: string[]
  }>
}

export interface MadfinGetPaymentResponse {
  timestamp: string
  status: number
  result?: MadfinPaymentResult & {
    created?: string
    description?: string
    paymentMethod?: string
    customerAmount?: number
    customerCurrency?: string
    externalResultCode?: string
    customer?: MadfinCustomer
    billingAddress?: MadfinBillingAddress
  }
  error?: string
  message?: string
}

/**
 * Sanitizes phone number to conform with Madfin requirements:
 * International phone number without leading '+', with a space separator between country code and local number. Max 18 chars.
 */
export function sanitizeMadfinPhone(phone?: string | null): string {
  const cleaned = String(phone || '')
    .replace(/^\+/, '')
    .replace(/[^0-9\s]/g, '')
    .trim()

  if (!cleaned) {
    return '44 02072243688'
  }

  if (cleaned.includes(' ')) {
    return cleaned.slice(0, 18)
  }

  if (cleaned.length >= 4) {
    const countryCode = cleaned.slice(0, 2)
    const rest = cleaned.slice(2)
    return `${countryCode} ${rest}`.slice(0, 18)
  }

  return cleaned.slice(0, 18)
}

/**
 * Ensures 2-character uppercase ISO country code.
 */
export function sanitizeCountryCode(code?: string | null, fallback = 'GB'): string {
  const trimmed = String(code || '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(trimmed)) {
    return trimmed
  }
  return fallback
}

/**
 * Creates a payment session via POST /api/v1/payments
 */
export async function createMadfinPayment(
  input: CreateMadfinPaymentInput
): Promise<MadfinCreatePaymentResponse> {
  const baseUrl = (config.madfin.apiUrl || 'https://engine-sandbox.madfin.tech').replace(/\/$/, '')
  const apiKey = config.madfin.apiKey

  if (!apiKey) {
    throw new Error('MADFIN_API_KEY is not configured')
  }

  const sanitizedCustomer: MadfinCustomer = {
    referenceId: String(input.customer.referenceId || '').slice(0, 128),
    firstName: String(input.customer.firstName || 'Customer').slice(0, 128),
    lastName: String(input.customer.lastName || 'User').slice(0, 128),
    email: String(input.customer.email || '').slice(0, 256),
    phone: sanitizeMadfinPhone(input.customer.phone),
    citizenshipCountryCode: sanitizeCountryCode(input.customer.citizenshipCountryCode, 'GB'),
    locale: String(input.customer.locale || 'en').slice(0, 2),
    ...(input.customer.dateOfBirth ? { dateOfBirth: input.customer.dateOfBirth.slice(0, 10) } : {}),
    ...(input.customer.ip ? { ip: input.customer.ip } : {}),
  }

  const sanitizedBillingAddress: MadfinBillingAddress = {
    addressLine1: String(input.billingAddress.addressLine1 || '221b Baker St, Marylebone').slice(0, 300),
    ...(input.billingAddress.addressLine2
      ? { addressLine2: String(input.billingAddress.addressLine2).slice(0, 300) }
      : {}),
    city: String(input.billingAddress.city || 'London').slice(0, 50),
    countryCode: sanitizeCountryCode(input.billingAddress.countryCode, 'GB'),
    postalCode: String(input.billingAddress.postalCode || 'NW1 6XE').slice(0, 12),
    ...(input.billingAddress.state ? { state: String(input.billingAddress.state).slice(0, 40) } : {}),
  }

  const body = {
    paymentType: 'DEPOSIT',
    amount: input.amount,
    currency: String(input.currency || 'GBP').toUpperCase(),
    referenceId: input.referenceId,
    ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
    ...(input.returnUrl ? { returnUrl: input.returnUrl } : {}),
    customer: sanitizedCustomer,
    billingAddress: sanitizedBillingAddress,
  }

  const response = await fetch(`${baseUrl}/api/v1/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const json = (await response.json().catch(() => ({}))) as MadfinCreatePaymentResponse

  if (!response.ok) {
    console.error('[Madfin Client] POST /api/v1/payments failed:', {
      status: response.status,
      error: json.error,
      message: json.message,
      errors: json.errors,
    })

    const fieldErrorsMessage = json.errors?.map((e) => `${e.field}: ${e.defaultMessage}`).join(', ')
    const errorMessage = fieldErrorsMessage || json.message || json.error || `Madfin API error (${response.status})`
    throw new Error(errorMessage)
  }

  return json
}

/**
 * Fetches current status of a payment via GET /api/v1/payments/{id}
 */
export async function getMadfinPaymentStatus(paymentId: string): Promise<MadfinGetPaymentResponse> {
  const baseUrl = (config.madfin.apiUrl || 'https://engine-sandbox.madfin.tech').replace(/\/$/, '')
  const apiKey = config.madfin.apiKey

  if (!apiKey) {
    throw new Error('MADFIN_API_KEY is not configured')
  }

  const response = await fetch(`${baseUrl}/api/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  const json = (await response.json().catch(() => ({}))) as MadfinGetPaymentResponse

  if (!response.ok) {
    console.error('[Madfin Client] GET /api/v1/payments failed:', {
      status: response.status,
      paymentId,
      error: json.error,
      message: json.message,
    })
    throw new Error(json.message || json.error || `Failed to fetch payment status (${response.status})`)
  }

  return json
}

/**
 * Verifies webhook HMAC-SHA256 signature using Madfin Shop Signing Key
 */
export function verifyMadfinWebhookSignature(rawBody: string, signatureHeader?: string | null): boolean {
  const signingKey = config.madfin.signingKey
  if (!signingKey || !signatureHeader) {
    return false
  }

  try {
    const computedSignatureHex = crypto.createHmac('sha256', signingKey).update(rawBody).digest('hex')
    const computedSignatureBase64 = crypto.createHmac('sha256', signingKey).update(rawBody).digest('base64')

    const cleanHeader = signatureHeader.trim()

    if (cleanHeader === computedSignatureHex || cleanHeader === computedSignatureBase64) {
      return true
    }

    if (cleanHeader.length === computedSignatureHex.length) {
      return crypto.timingSafeEqual(Buffer.from(computedSignatureHex), Buffer.from(cleanHeader))
    }
    if (cleanHeader.length === computedSignatureBase64.length) {
      return crypto.timingSafeEqual(Buffer.from(computedSignatureBase64), Buffer.from(cleanHeader))
    }

    return false
  } catch (error) {
    console.error('[Madfin Client] Webhook signature verification error:', error)
    return false
  }
}
