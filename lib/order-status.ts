// lib/order-status.ts - Customer-facing order status, shared by API routes and the dashboard

export type OrderStatus = 'processing' | 'ready' | 'delayed' | 'cancelled' | 'refunded'

export const ORDER_STATUSES: OrderStatus[] = ['processing', 'ready', 'delayed', 'cancelled', 'refunded']

/** Custom courses are delivered 48–96 hours after the order. */
export const CUSTOM_COURSE_DELIVERY_HOURS = { min: 48, max: 96 }

/** How far a delivery date moves when an order is delayed. */
export const DELAY_EXTENSION_HOURS = { custom: 48, ai: 24 }

export type OrderKind = 'custom' | 'ai'

/**
 * Map a DB job status to the status shown to the customer.
 * A custom course stays "processing" until its delivery date, even if the PDF already exists.
 */
export function getOrderStatus(
  job: { status: string; estimated_ready_at?: Date | string | null },
  now: Date = new Date()
): OrderStatus {
  switch (job.status) {
    case 'refunded':
      return 'refunded'
    case 'cancelled':
      return 'cancelled'
    case 'delayed':
      return 'delayed'
    case 'ready':
    case 'completed':
      if (job.estimated_ready_at && new Date(job.estimated_ready_at) > now) return 'processing'
      return 'ready'
    default:
      // in_queue, processing, and 'failed' between Inngest retries (a final failure becomes 'delayed')
      return 'processing'
  }
}

/** Delayed orders can be rescheduled or cancelled with a refund. */
export function canRespondToDelay(status: string): boolean {
  return status === 'delayed'
}

/** Order number shown to the customer and stored with the consent record. */
export function formatOrderRef(kind: OrderKind | 'course', id: number, createdAt?: Date): string {
  const padded = id.toString().padStart(6, '0')
  if (kind === 'course') return `INV-${(createdAt ?? new Date()).getFullYear()}-${padded}`
  return kind === 'custom' ? `CC-${padded}` : `AI-${padded}`
}
