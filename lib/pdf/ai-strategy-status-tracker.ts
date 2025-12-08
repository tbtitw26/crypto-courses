// lib/pdf/ai-strategy-status-tracker.ts - Track AI strategy generation progress

import fs from 'fs/promises'
import path from 'path'

const STATUS_FILE = path.join(process.cwd(), 'public', 'courses', '.ai-strategy-generation-status.json')
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
let memoryStatus: AiStrategyGenerationStatus | null = null

export interface AiStrategyGenerationStatus {
  strategyRunId?: number
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

async function saveAiStrategyStatus(status: AiStrategyGenerationStatus): Promise<void> {
  if (isServerless) {
    memoryStatus = status
    return
  }
  try {
    const statusDir = path.dirname(STATUS_FILE)
    await fs.mkdir(statusDir, { recursive: true })
    await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2))
  } catch (error) {
    console.error('Failed to save AI strategy status:', error)
  }
}

export async function loadAiStrategyStatus(): Promise<AiStrategyGenerationStatus | null> {
  if (isServerless) {
    return memoryStatus
  }
  try {
    const content = await fs.readFile(STATUS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function clearAiStrategyStatus(): Promise<void> {
  if (isServerless) {
    memoryStatus = null
    return
  }
  try {
    await fs.unlink(STATUS_FILE)
  } catch {
    // ignore
  }
}

export async function updateAiStrategyStatus(updates: Partial<AiStrategyGenerationStatus>): Promise<void> {
  const current = await loadAiStrategyStatus()
  const next: AiStrategyGenerationStatus = {
    strategyRunId: updates.strategyRunId ?? current?.strategyRunId,
    courseId: updates.courseId ?? current?.courseId,
    stage: updates.stage || current?.stage || 'idle',
    progress: updates.progress ?? current?.progress ?? 0,
    message: updates.message || current?.message || '',
    error: updates.error,
    warnings: updates.warnings ?? current?.warnings,
    startedAt: updates.startedAt ?? current?.startedAt,
    completedAt: updates.completedAt ?? current?.completedAt,
    intermediateFiles: updates.intermediateFiles ?? current?.intermediateFiles,
  }

  await saveAiStrategyStatus(next)
}

