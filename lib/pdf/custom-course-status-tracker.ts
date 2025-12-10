// lib/pdf/custom-course-status-tracker.ts - Track custom course generation progress

import { prisma, withPrismaRetry } from '@/lib/prisma'

export interface CustomCourseGenerationStatus {
  courseRequestId: number
  courseId?: string
  stage: 'idle' | 'generating_en' | 'generating_cover' | 'generating_diagrams' | 'translating_ar' | 'generating_pdf_en' | 'generating_pdf_ar' | 'sending_emails' | 'completed' | 'error'
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

export async function loadCustomCourseStatus(courseRequestId: number): Promise<CustomCourseGenerationStatus | null> {
  const record = await withPrismaRetry(() =>
    prisma.customCourseRequest.findUnique({
      where: { id: courseRequestId },
      select: {
        id: true,
        status_stage: true,
        status_progress: true,
        status_message: true,
        status_error: true,
      },
    })
  )

  if (!record) {
    return null
  }

  return {
    courseRequestId,
    stage: (record.status_stage as CustomCourseGenerationStatus['stage']) || 'idle',
    progress: record.status_progress ?? 0,
    message: record.status_message || '',
    error: record.status_error || undefined,
  }
}

export async function clearCustomCourseStatus(courseRequestId: number): Promise<void> {
  await withPrismaRetry(() =>
    prisma.customCourseRequest.update({
      where: { id: courseRequestId },
      data: {
        status_stage: null,
        status_progress: null,
        status_message: null,
        status_error: null,
      },
    })
  )
}

export async function updateCustomCourseStatus(status: CustomCourseGenerationStatus): Promise<void> {
  const { courseRequestId, stage, progress, message, error, warnings, startedAt, completedAt, intermediateFiles } = status
  await withPrismaRetry(() =>
    prisma.customCourseRequest.update({
      where: { id: courseRequestId },
      data: {
        status_stage: stage,
        status_progress: progress,
        status_message: message,
        status_error: error ?? null,
      },
    })
  )
}

