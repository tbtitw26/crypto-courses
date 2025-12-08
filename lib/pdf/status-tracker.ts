// lib/pdf/status-tracker.ts - Track generation progress

import fs from 'fs/promises'
import path from 'path'

const STATUS_FILE = path.join(process.cwd(), 'public', 'courses', '.generation-status.json')
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
let memoryStatus: GenerationStatus | null = null

export interface GenerationStatus {
  courseId?: string
  stage: 'idle' | 'generating_en' | 'generating_cover' | 'generating_diagrams' | 'translating_ar' | 'generating_pdf_en' | 'generating_pdf_ar' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  error?: string
  warnings?: string[] // Warnings about skipped steps
  startedAt?: string
  completedAt?: string
  intermediateFiles?: {
    courseEnJson?: string
    courseArJson?: string
    coverImage?: string
    diagrams?: Record<string, string>
  }
}

/**
 * Save generation status
 */
export async function saveStatus(status: GenerationStatus): Promise<void> {
  if (isServerless) {
    memoryStatus = status
    return
  }
  try {
    const statusDir = path.dirname(STATUS_FILE)
    await fs.mkdir(statusDir, { recursive: true })
    await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2))
  } catch (error) {
    console.error('Failed to save status:', error)
  }
}

/**
 * Load generation status
 */
export async function loadStatus(): Promise<GenerationStatus | null> {
  if (isServerless) {
    return memoryStatus
  }
  try {
    const content = await fs.readFile(STATUS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
}

/**
 * Clear generation status
 */
export async function clearStatus(): Promise<void> {
  if (isServerless) {
    memoryStatus = null
    return
  }
  try {
    await fs.unlink(STATUS_FILE)
  } catch (error) {
    // Ignore if file doesn't exist
  }
}

/**
 * Update status with progress
 */
export async function updateStatus(updates: Partial<GenerationStatus>): Promise<void> {
  const current = await loadStatus()
  const newStatus: GenerationStatus = {
    ...current,
    ...updates,
    stage: updates.stage || current?.stage || 'idle',
    progress: updates.progress ?? current?.progress ?? 0,
    message: updates.message || current?.message || '',
  }
  await saveStatus(newStatus)
}

