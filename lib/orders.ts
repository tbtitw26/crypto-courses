// lib/orders.ts - Delays, rescheduling and refunds for custom courses and AI strategies

import { prisma, withPrismaRetry } from '@/lib/prisma'
import { inngest } from '@/inngest/client'
import { sendOrderStatusEmail } from '@/lib/email'
import { DELAY_EXTENSION_HOURS, formatOrderRef, type OrderKind } from '@/lib/order-status'
import type { AIStrategyRequestedEvent, CustomCourseRequestedEvent } from '@/inngest/types'

const HOUR_MS = 60 * 60 * 1000

type JobRecord = {
  id: number
  user_id: number
  status: string
  tokens_cost: number
  language: string
  proposed_ready_at: Date | null
  delay_notified_at: Date | null
  request_payload: unknown
  created_at: Date
  user: { email: string; first_name: string; last_name: string | null }
  goals_free_text?: string
  main_objective?: string
}

const userSelect = { select: { email: true, first_name: true, last_name: true } }

async function findJob(kind: OrderKind, jobId: number): Promise<JobRecord | null> {
  if (kind === 'custom') {
    return withPrismaRetry(() =>
      prisma.customCourseRequest.findUnique({ where: { id: jobId }, include: { user: userSelect } })
    )
  }
  return withPrismaRetry(() =>
    prisma.aiStrategyRun.findUnique({ where: { id: jobId }, include: { user: userSelect } })
  )
}

/** Update a job only while it is in one of `fromStatuses`; returns false if another request got there first. */
async function transitionJob(kind: OrderKind, jobId: number, fromStatuses: string[], data: Record<string, unknown>) {
  const where = { id: jobId, status: { in: fromStatuses } }
  const result =
    kind === 'custom'
      ? await withPrismaRetry(() => prisma.customCourseRequest.updateMany({ where, data }))
      : await withPrismaRetry(() => prisma.aiStrategyRun.updateMany({ where, data }))
  return result.count > 0
}

export function getProductName(kind: OrderKind, job: { goals_free_text?: string; main_objective?: string }) {
  const text = (kind === 'custom' ? job.goals_free_text : job.main_objective) || ''
  const short = text.length > 50 ? `${text.substring(0, 50)}...` : text
  return `${kind === 'custom' ? 'Custom course' : 'AI strategy'}: ${short}`
}

function userName(job: JobRecord) {
  return `${job.user.first_name} ${job.user.last_name || ''}`.trim() || 'User'
}

/**
 * Mark a job as delayed after generation failed or timed out, propose a new date and tell the customer once.
 */
export async function markJobDelayed(kind: OrderKind, jobId: number, reason: string) {
  const proposedReadyAt = new Date(Date.now() + DELAY_EXTENSION_HOURS[kind] * HOUR_MS)
  const moved = await transitionJob(kind, jobId, ['in_queue', 'processing', 'failed'], {
    status: 'delayed',
    status_stage: 'delayed',
    status_error: reason,
    status_message: 'Delivery delayed',
    proposed_ready_at: proposedReadyAt,
  })
  if (!moved) return

  const job = await findJob(kind, jobId)
  if (!job || job.delay_notified_at) return

  const emailResult = await sendOrderStatusEmail({
    event: 'delayed',
    userEmail: job.user.email,
    userName: userName(job),
    productName: getProductName(kind, job),
    orderRef: formatOrderRef(kind, job.id),
    newDate: proposedReadyAt,
  })
  if (!emailResult.error) {
    await transitionJob(kind, jobId, ['delayed'], { delay_notified_at: new Date() })
  }
}

function buildRequestEvent(kind: OrderKind, job: any) {
  const payload = (job.request_payload ?? {}) as Record<string, any>
  const base = {
    ...payload,
    jobId: job.id,
    userId: job.user_id,
    language: job.language as 'en' | 'ar',
    requestedAt: new Date().toISOString(),
    experienceYears: job.experience_years,
    depositBudget: job.deposit_budget,
    riskTolerance: job.risk_tolerance,
    markets: job.markets,
    tradingStyle: job.trading_style,
    tokensCost: job.tokens_cost,
  }

  if (kind === 'custom') {
    return {
      id: `custom_course/requested:${job.id}:retry:${Date.now()}`,
      name: 'custom_course/requested' as const,
      data: {
        ...base,
        goalsFreeText: job.goals_free_text,
        additionalNotes: job.additional_notes ?? undefined,
        userEmail: job.user.email,
      } as CustomCourseRequestedEvent,
    }
  }
  return {
    id: `ai_strategy/requested:${job.id}:retry:${Date.now()}`,
    name: 'ai_strategy/requested' as const,
    data: {
      ...base,
      timeCommitment: job.time_commitment ?? undefined,
      mainObjective: job.main_objective,
    } as AIStrategyRequestedEvent,
  }
}

export type DelayResponseResult =
  | { ok: true; status: 'processing' | 'refunded'; newDate?: string; refundedTokens?: number }
  | { ok: false; code: 'not_found' | 'forbidden' | 'not_delayed' }

/**
 * Customer accepts the proposed date (generation is re-run) or cancels with a refund of the Usage Units paid.
 */
export async function respondToDelay(
  kind: OrderKind,
  jobId: number,
  userId: number,
  action: 'accept' | 'cancel'
): Promise<DelayResponseResult> {
  const job = await findJob(kind, jobId)
  if (!job) return { ok: false, code: 'not_found' }
  if (job.user_id !== userId) return { ok: false, code: 'forbidden' }

  const productName = getProductName(kind, job)
  const orderRef = formatOrderRef(kind, job.id)

  if (action === 'cancel') {
    const now = new Date()
    const refunded = await prisma.$transaction(async (tx) => {
      const where = { id: jobId, status: 'delayed' }
      const data = { status: 'refunded', status_stage: 'refunded', cancelled_at: now, refunded_at: now, refunded_tokens: job.tokens_cost }
      const updated =
        kind === 'custom'
          ? await tx.customCourseRequest.updateMany({ where, data })
          : await tx.aiStrategyRun.updateMany({ where, data })
      if (updated.count === 0) return false
      await tx.user.update({ where: { id: userId }, data: { balance: { increment: job.tokens_cost } } })
      return true
    })
    if (!refunded) return { ok: false, code: 'not_delayed' }

    await sendOrderStatusEmail({
      event: 'refunded',
      userEmail: job.user.email,
      userName: userName(job),
      productName,
      orderRef,
      refundedTokens: job.tokens_cost,
    })
    return { ok: true, status: 'refunded', refundedTokens: job.tokens_cost }
  }

  const newDate =
    job.proposed_ready_at && job.proposed_ready_at > new Date()
      ? job.proposed_ready_at
      : new Date(Date.now() + DELAY_EXTENSION_HOURS[kind] * HOUR_MS)

  const accepted = await transitionJob(kind, jobId, ['delayed'], {
    status: 'in_queue',
    status_stage: 'queued',
    status_progress: 0,
    status_error: null,
    status_message: 'Rescheduled by customer',
    proposed_ready_at: null,
    delay_notified_at: null,
    ...(kind === 'custom' && { estimated_ready_at: newDate }),
  })
  if (!accepted) return { ok: false, code: 'not_delayed' }

  await inngest.send(buildRequestEvent(kind, job))
  await sendOrderStatusEmail({
    event: 'rescheduled',
    userEmail: job.user.email,
    userName: userName(job),
    productName,
    orderRef,
    newDate,
  })
  return { ok: true, status: 'processing', newDate: newDate.toISOString() }
}
