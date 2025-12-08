// app/api/ai-strategies/route.ts - Returns AI Strategy runs for the authenticated user

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PrismaJson = Record<string, any> | Array<any> | string | number | boolean | null

function extractCourseId(payload: PrismaJson | null): string | undefined {
  if (!payload) return undefined
  let parsed: any = payload

  if (typeof payload === 'string') {
    try {
      parsed = JSON.parse(payload)
    } catch {
      return undefined
    }
  }

  if (parsed?.meta?.course_id) return parsed.meta.course_id
  if (parsed?.course?.meta?.course_id) return parsed.course.meta.course_id
  if (parsed?.courseEn?.meta?.course_id) return parsed.courseEn.meta.course_id
  return undefined
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const aiRuns = await withPrismaRetry(() =>
      prisma.aiStrategyRun.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          status: true,
          main_objective: true,
          markets: true,
          tokens_cost: true,
          created_at: true,
          language: true,
          ai_response_structured: true,
          rendered_text: true,
        },
      })
    )

    const strategies = aiRuns.map((run) => {
      const courseId =
        extractCourseId(run.ai_response_structured as PrismaJson) ||
        extractCourseId(run.rendered_text as PrismaJson)

      const primaryLanguage = (run.language || 'en').toLowerCase()
      const pdfLinks: Array<{ language: 'en' | 'ar'; url: string }> = []

      if (courseId) {
        pdfLinks.push({ language: 'en', url: `/courses/${courseId}-en.pdf` })
        if (primaryLanguage === 'ar') {
          pdfLinks.push({ language: 'ar', url: `/courses/${courseId}-ar.pdf` })
        }
      }

      return {
        id: String(run.id),
        title: run.main_objective?.trim() || `Strategy #${run.id}`,
        markets: run.markets,
        status: run.status as 'processing' | 'ready' | 'failed',
        created: run.created_at.toISOString(),
        tokens: run.tokens_cost,
        languages: [primaryLanguage],
        pdfLinks,
      }
    })

    return NextResponse.json({ strategies })
  } catch (error) {
    console.error('[AI Strategies API] Error fetching strategies:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch AI strategies',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


