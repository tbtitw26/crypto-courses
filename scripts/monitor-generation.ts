#!/usr/bin/env tsx

/**
 * Monitor course generation in real-time
 * Watches the database for status updates and logs
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()
const LOG_FILE = path.join(process.cwd(), 'logs', 'course-generation.log')

interface Status {
  id: number
  type: 'custom-course' | 'ai-strategy'
  status: string
  stage?: string | null
  progress?: number | null
  message?: string | null
  error?: string | null
  updatedAt: Date
}

async function getCustomCourseStatuses(): Promise<Status[]> {
  const requests = await prisma.customCourseRequest.findMany({
    where: {
      status: {
        in: ['processing', 'ready', 'failed'],
      },
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    select: {
      id: true,
      status: true,
      status_stage: true,
      status_progress: true,
      status_message: true,
      status_error: true,
      updated_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 10,
  })

  return requests.map((r) => ({
    id: r.id,
    type: 'custom-course' as const,
    status: r.status,
    stage: r.status_stage,
    progress: r.status_progress,
    message: r.status_message,
    error: r.status_error,
    updatedAt: r.updated_at,
  }))
}

async function getAiStrategyStatuses(): Promise<Status[]> {
  const runs = await prisma.aiStrategyRun.findMany({
    where: {
      status: {
        in: ['processing', 'ready', 'failed'],
      },
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    select: {
      id: true,
      status: true,
      status_stage: true,
      status_progress: true,
      status_message: true,
      status_error: true,
      updated_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 10,
  })

  return runs.map((r) => ({
    id: r.id,
    type: 'ai-strategy' as const,
    status: r.status,
    stage: r.status_stage,
    progress: r.status_progress,
    message: r.status_message,
    error: r.status_error,
    updatedAt: r.updated_at,
  }))
}

function formatStatus(status: Status): string {
  const typeLabel = status.type === 'custom-course' ? 'Custom Course' : 'AI Strategy'
  const statusEmoji = status.status === 'ready' ? '✅' : status.status === 'failed' ? '❌' : '⏳'
  const progressBar = status.progress
    ? `[${'█'.repeat(Math.floor(status.progress / 10))}${'░'.repeat(10 - Math.floor(status.progress / 10))}] ${status.progress}%`
    : ''
  
  return `${statusEmoji} ${typeLabel} #${status.id} | ${status.status.toUpperCase()} ${progressBar}
  Stage: ${status.stage || 'N/A'}
  Message: ${status.message || 'N/A'}
  ${status.error ? `❌ Error: ${status.error}` : ''}
  Updated: ${status.updatedAt.toLocaleString()}
`
}

async function readRecentLogs(lines: number = 20): Promise<string[]> {
  try {
    const content = await readFile(LOG_FILE, 'utf-8')
    const allLines = content.split('\n').filter(Boolean)
    return allLines.slice(-lines)
  } catch (error) {
    return ['Log file not found or empty']
  }
}

async function monitor() {
  console.clear()
  console.log('🔍 Course Generation Monitor')
  console.log('='.repeat(60))
  console.log()

  try {
    const [customCourses, aiStrategies] = await Promise.all([
      getCustomCourseStatuses(),
      getAiStrategyStatuses(),
    ])

    const allStatuses = [...customCourses, ...aiStrategies].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    )

    if (allStatuses.length === 0) {
      console.log('📭 No active generations found (last 24 hours)')
    } else {
      console.log(`📊 Active Generations (${allStatuses.length}):\n`)
      allStatuses.forEach((status) => {
        console.log(formatStatus(status))
        console.log()
      })
    }

    console.log('📋 Recent Logs:')
    console.log('-'.repeat(60))
    const recentLogs = await readRecentLogs(10)
    recentLogs.forEach((line) => {
      if (line.includes('[ERROR]')) {
        console.log(`\x1b[31m${line}\x1b[0m`)
      } else if (line.includes('[WARN]')) {
        console.log(`\x1b[33m${line}\x1b[0m`)
      } else {
        console.log(line)
      }
    })
  } catch (error) {
    console.error('❌ Error monitoring:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run monitor
monitor().catch(console.error)

