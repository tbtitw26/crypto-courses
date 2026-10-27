// lib/corefy-client.ts - Corefy / Sterling Pay Hosted Payment Page (HPP) Client

import crypto from 'node:crypto'
import { config } from '@/lib/config'

export interface CorefyCustomerAddress {
  fullAddress?: string
  country?: string // 2-letter ISO
  region?: string
  city?: string
  street?: string
  postalCode?: string
}

export interface CorefyCustomer {
  referenceId: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: CorefyCustomerAddress
}

export interface CreateCorefyInvoiceInput {
  referenceId: string
  amount: number
  currency: string
  description?: string
  returnUrl: string
  cancelUrl?: string
  callbackUrl?: string
  serviceCode?: string
  testMode?: boolean
  customer: CorefyCustomer
  metadata?: Record<string, any>
}

export interface CorefyInvoiceAttributes {
  status?: string // 'processed' | 'process_pending' | 'process_failed' | 'authorize_failed' | 'expired' | 'refunded'
  resolution?: string
  amount?: number
  processed_amount?: number
  currency?: string
  reference_id?: string
  service?: string
  flow_data?: {
    action?: string
    method?: string
    params?: Record<string, any>
  }
  hpp_url?: string
  metadata?: Record<string, any>
  created?: string
  updated?: string
}

export interface CorefyInvoiceData {
  id: string
  type: string
  attributes: CorefyInvoiceAttributes
}

export interface CorefyInvoiceResponse {
  data?: CorefyInvoiceData
  errors?: Array<{
    title?: string
    detail?: string
    status?: string | number
    source?: { pointer?: string; parameter?: string }
  }>
}

export interface CorefyWebhookPayload {
  data?: {
    id: string
    type?: string
    attributes?: CorefyInvoiceAttributes
  }
}

/**
 * Resolves the service code for Corefy.
 * If set to 'auto' or empty, resolves to payment_card_{currency.toLowerCase()}_hpp
 */
export function resolveCorefyServiceCode(serviceCode?: string, currency = 'EUR'): string {
  if (!serviceCode || serviceCode === 'auto') {
    return `payment_card_${currency.toLowerCase()}_hpp`
  }
  return serviceCode
}

/**
 * Builds Basic Authentication header value for Corefy API
 */
function getCorefyBasicAuthHeader(): string {
  const accountId = config.corefy.accountId.trim()
  const apiKey = config.corefy.apiKey.trim()

  if (!accountId || !apiKey) {
    throw new Error('COREFY_ACCOUNT_ID and COREFY_API_KEY must be configured')
  }

  return 'Basic ' + Buffer.from(`${accountId}:${apiKey}`).toString('base64')
}

/**
 * Helper to ensure URLs sent to Corefy are public HTTPS URLs.
 * Corefy gateway rejects localhost / 127.0.0.1 with HTTP 422 validation_error.
 */
function toPublicHttpsUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const publicBase = (
    process.env.COREFY_PUBLIC_DOMAIN ||
    (process.env.SITE_BASE_URL && !process.env.SITE_BASE_URL.includes('localhost') ? process.env.SITE_BASE_URL : null) ||
    'https://www.cur-nova.com'
  ).replace(/\/$/, '')

  return url.replace(/^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i, publicBase)
}

/**
 * Create Payment Invoice in Corefy to obtain HPP redirect URL
 */
export async function createCorefyPaymentInvoice(
  input: CreateCorefyInvoiceInput
): Promise<{ invoiceId: string; redirectUrl: string; rawResponse: CorefyInvoiceResponse }> {
  const currency = input.currency.toUpperCase()
  const service = resolveCorefyServiceCode(input.serviceCode || config.corefy.serviceCode, currency)
  const isTestMode = input.testMode !== undefined ? input.testMode : config.corefy.testMode

  // Local mock testing mode when API keys are not yet configured or explicitly mocked
  const isMockMode =
    !config.corefy.accountId ||
    !config.corefy.apiKey ||
    config.corefy.apiKey === 'mock' ||
    process.env.COREFY_MOCK === 'true'

  if (isMockMode) {
    const invoiceId = `inv_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const returnUrl = input.returnUrl
    const cancelUrl = input.cancelUrl || input.returnUrl
    const redirectUrl = `/corefy-mock-hpp?invoiceId=${encodeURIComponent(invoiceId)}&reference=${encodeURIComponent(input.referenceId)}&amount=${encodeURIComponent(String(input.amount))}&currency=${encodeURIComponent(currency)}&returnUrl=${encodeURIComponent(returnUrl)}&cancelUrl=${encodeURIComponent(cancelUrl)}`

    console.log('[Corefy Client] Local Mock Mode active: Redirecting to mock HPP page', {
      invoiceId,
      referenceId: input.referenceId,
      amount: input.amount,
      currency,
    })

    return {
      invoiceId,
      redirectUrl,
      rawResponse: {
        data: {
          id: invoiceId,
          type: 'payment-invoices',
          attributes: {
            status: 'process_pending',
            reference_id: input.referenceId,
            amount: input.amount,
            currency,
            hpp_url: redirectUrl,
          },
        },
      },
    }
  }

  const baseUrl = config.corefy.apiUrl.replace(/\/$/, '')
  const authHeader = getCorefyBasicAuthHeader()

  const customerName =
    input.customer.name ||
    [input.customer.firstName, input.customer.lastName].filter(Boolean).join(' ').trim() ||
    'Customer'

  const fullAddress =
    input.customer.address?.fullAddress ||
    [input.customer.address?.street, input.customer.address?.city, input.customer.address?.country]
      .filter(Boolean)
      .join(', ') ||
    '221b Baker St, London'

  const safeReturnUrl = toPublicHttpsUrl(input.returnUrl)
  const safeCancelUrl = toPublicHttpsUrl(input.cancelUrl) || safeReturnUrl
  const safeCallbackUrl = toPublicHttpsUrl(input.callbackUrl)

  // Only pass callback_url if it is a public https URL (Corefy cloud rejects localhost / http URLs)
  const isHttpsCallback = safeCallbackUrl && safeCallbackUrl.startsWith('https://')

  const payload = {
    data: {
      type: 'payment-invoices',
      attributes: {
        reference_id: input.referenceId,
        amount: Number(input.amount.toFixed(2)),
        currency,
        service,
        flow: 'charge',
        test_mode: isTestMode,
        description: input.description || `Order payment #${input.referenceId}`,
        customer: {
          reference_id: input.customer.referenceId,
          email: input.customer.email,
          name: customerName,
          first_name: input.customer.firstName || customerName,
          surname: input.customer.lastName || 'User',
          phone: input.customer.phone || '4402072243688',
          address: {
            full_address: fullAddress,
            country: input.customer.address?.country || 'GB',
            region: input.customer.address?.region || '',
            city: input.customer.address?.city || 'London',
            street: input.customer.address?.street || fullAddress,
            post_code: input.customer.address?.postalCode || 'NW1 6XE',
          },
        },
        return_url: safeReturnUrl,
        return_urls: {
          success: safeReturnUrl,
          pending: safeReturnUrl,
          fail: safeCancelUrl || safeReturnUrl,
        },
        ...(isHttpsCallback ? { callback_url: safeCallbackUrl } : {}),
        metadata: {
          reference_id: input.referenceId,
          source: 'nextjs_hpp',
          ...(input.metadata || {}),
        },
      },
    },
  }

  const endpoint = `${baseUrl}/payment-invoices`

  console.log('[Corefy Client] Creating invoice:', {
    endpoint,
    referenceId: input.referenceId,
    amount: input.amount,
    currency,
    service,
    test_mode: isTestMode,
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      Authorization: authHeader,
      'User-Agent': 'NextJS Corefy HPP Client/1.0',
    },
    body: JSON.stringify(payload),
  })

  const bodyRaw = await response.text()
  let body: CorefyInvoiceResponse = {}

  try {
    body = JSON.parse(bodyRaw)
  } catch {
    console.error('[Corefy Client] Invalid JSON response from Corefy:', bodyRaw)
    throw new Error(`Invalid response from Corefy API (HTTP ${response.status})`)
  }

  if (!response.ok || !body.data?.id) {
    console.error('[Corefy Client] Invoice creation failed:', {
      status: response.status,
      body,
    })

    let errorMessage = `Failed to create Corefy payment invoice (HTTP ${response.status})`
    if (body.errors && Array.isArray(body.errors) && body.errors.length > 0) {
      errorMessage = body.errors
        .map((err) => [err.title, err.detail, err.status].filter(Boolean).join(': '))
        .join('; ')
    }

    throw new Error(errorMessage)
  }

  const invoiceId = body.data.id
  const attrs = body.data.attributes || {}
  const redirectUrl = attrs.flow_data?.action || attrs.hpp_url

  if (!redirectUrl) {
    console.error('[Corefy Client] No redirect URL (flow_data.action or hpp_url) in response:', attrs)
    throw new Error('Hosted Payment Page URL (HPP) was not found in the Corefy gateway response')
  }

  return {
    invoiceId,
    redirectUrl,
    rawResponse: body,
  }
}

/**
 * Fetches current invoice status by ID from Corefy API
 */
export async function getCorefyInvoiceStatus(
  invoiceId: string
): Promise<CorefyInvoiceAttributes | null> {
  const baseUrl = config.corefy.apiUrl.replace(/\/$/, '')
  const authHeader = getCorefyBasicAuthHeader()
  const endpoint = `${baseUrl}/payment-invoices/${encodeURIComponent(invoiceId)}`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: authHeader,
      'User-Agent': 'NextJS Corefy HPP Client/1.0',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    console.error('[Corefy Client] Failed to fetch invoice status:', {
      invoiceId,
      status: response.status,
    })
    return null
  }

  const body = (await response.json().catch(() => ({}))) as CorefyInvoiceResponse
  return body.data?.attributes || null
}

/**
 * Verifies webhook signature against HMAC-SHA256 or HMAC-SHA1
 */
export function verifyCorefyWebhookSignature(
  rawBody: string,
  signatureHeader?: string | null
): boolean {
  const secret = config.corefy.webhookSecret?.trim()
  if (!secret) {
    // If no secret configured, accept webhook (or configure secret in production)
    return true
  }

  if (!signatureHeader) {
    return false
  }

  const cleanSignature = signatureHeader.trim()

  try {
    const sha256Hex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const sha1Hex = crypto.createHmac('sha1', secret).update(rawBody).digest('hex')
    const sha256Base64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')

    if (cleanSignature === sha256Hex || cleanSignature === sha1Hex || cleanSignature === sha256Base64) {
      return true
    }

    if (cleanSignature.length === sha256Hex.length) {
      return crypto.timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(sha256Hex))
    }
    if (cleanSignature.length === sha1Hex.length) {
      return crypto.timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(sha1Hex))
    }
    if (cleanSignature.length === sha256Base64.length) {
      return crypto.timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(sha256Base64))
    }

    return false
  } catch (error) {
    console.error('[Corefy Client] Webhook signature verification error:', error)
    return false
  }
}
