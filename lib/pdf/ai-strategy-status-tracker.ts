// lib/pdf/ai-strategy-status-tracker.ts - Track AI strategy generation progress

import { prisma } from '@/lib/prisma'

export interface AiStrategyGenerationStatus {
  strategyRunId: number
  courseId?: string
  stage:
    | 'idle'
    | 'generating_en'
    | 'generating_cover'
    | 'generating_diagrams'
    | 'translating_ar'
    | 'generating_pdf_en'
    | 'generating_pdf_ar'
    | 'sending_emails'
    | 'completed'
    | 'error'
  progress: number
  message: string
  error?: string
  warnings?: string[]
  startedAt?: string
  completedAt?: string
  intermediateFiles?: {
    courseEnJson?: string
    courseArJson?: string
    coverImage?: string
    diagrams?: Record<string, string>
  }
}

export async function loadAiStrategyStatus(strategyRunId: number): Promise<AiStrategyGenerationStatus | null> {
  const record = await prisma.aiStrategyRun.findUnique({
    where: { id: strategyRunId },
    select: {
      id: true,
      status_stage: true,
      status_progress: true,
      status_message: true,
      status_error: true,
    },
  })

  if (!record) {
    return null
  }

  return {
    strategyRunId,
    stage: (record.status_stage as AiStrategyGenerationStatus['stage']) || 'idle',
    progress: record.status_progress ?? 0,
    message: record.status_message || '',
    error: record.status_error || undefined,
  }
}

export async function clearAiStrategyStatus(strategyRunId: number): Promise<void> {
  await prisma.aiStrategyRun.update({
    where: { id: strategyRunId },
    data: {
      status_stage: null,
      status_progress: null,
      status_message: null,
      status_error: null,
    },
  })
}

export async function updateAiStrategyStatus(status: AiStrategyGenerationStatus): Promise<void> {
  const { strategyRunId, stage, progress, message, error } = status
  await prisma.aiStrategyRun.update({
    where: { id: strategyRunId },
    data: {
      status_stage: stage,
      status_progress: progress,
      status_message: message,
      status_error: error ?? null,
    },
  })
}

