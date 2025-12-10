// lib/pdf/logger.ts - File-based logging for course generation

import fs from 'fs/promises'
import path from 'path'

// Lazy import prisma to avoid bundling in browser
let prismaSingleton: typeof import('@/lib/prisma').prisma | null = null
async function getPrismaClient() {
  if (prismaSingleton) return prismaSingleton
  const mod = await import('@/lib/prisma')
  prismaSingleton = mod.prisma
  return prismaSingleton
}

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'course-generation.log')
const canWriteToFs = !(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const logToDb = process.env.LOG_TO_DB === 'true'

// Track timing for operations
const timings = new Map<string, number>()

// Ensure log directory exists
async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true })
  } catch (error) {
    // Ignore if directory already exists
  }
}

/**
 * Format data for logging (safe JSON stringify with error handling)
 */
function formatData(data?: any): string {
  if (!data) return ''
  try {
    // Handle circular references and large objects
    const seen = new WeakSet()
    return JSON.stringify(data, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]'
        }
        seen.add(value)
        // Truncate very long strings
        if (typeof value === 'string' && value.length > 500) {
          return value.substring(0, 500) + '... [truncated]'
        }
      }
      return value
    }, 2)
  } catch (error) {
    return String(data)
  }
}

/**
 * Format elapsed time in human-readable format
 */
function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

// Context for current generation (set at start of generation)
let currentRunId: number | null = null
let currentRunType: string | null = null

export function setLogContext(runId: number, runType: 'custom-course' | 'ai-strategy') {
  currentRunId = runId
  currentRunType = runType
}

export function clearLogContext() {
  currentRunId = null
  currentRunType = null
}

/**
 * Log message to both console and file with enhanced formatting
 */
export async function log(level: 'info' | 'error' | 'warn' | 'debug', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const elapsed = timings.get('start') ? Date.now() - timings.get('start')! : 0
  const elapsedStr = elapsed > 0 ? `[+${formatElapsed(elapsed)}]` : ''
  
  // Merge context into data if available
  const enrichedData = {
    ...(currentRunId !== null && { runId: currentRunId, courseRequestId: currentRunId, strategyRunId: currentRunId }),
    ...(currentRunType !== null && { runType: currentRunType }),
    ...(data || {}),
  }
  
  const formattedData = formatData(enrichedData)
  // File log: detailed format with timestamp
  const fileLogMessage = `[${timestamp}] ${elapsedStr} [${level.toUpperCase()}] ${message}${formattedData ? `\n${formattedData}` : ''}\n`
  
  // Console log: cleaner format, with prefix for filtering
  const consoleMessage = `[GEN] ${elapsedStr} [${level.toUpperCase()}] ${message}`

  // Enhanced console logging with colors (for local dev)
  const isLocal = !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME
  if (isLocal) {
    const colors = {
      info: '\x1b[36m', // Cyan
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      debug: '\x1b[90m', // Gray
      reset: '\x1b[0m',
    }
    const color = colors[level] || colors.reset
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${color}[${level.toUpperCase()}]${colors.reset} ${elapsedStr} ${message}`,
      data || ''
    )
  } else {
    // Production: simple logging
    if (level === 'error') {
      console.error(consoleMessage, data || '')
    } else if (level === 'warn') {
      console.warn(consoleMessage, data || '')
    } else {
      console.log(consoleMessage, data || '')
    }
  }

  // Optional DB log (server only)
  if (logToDb && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production')) {
    try {
      const prisma = await getPrismaClient()
      // Trim message to avoid huge entries
      const msg = message.length > 2000 ? `${message.slice(0, 2000)}... [truncated]` : message
      const meta = enrichedData ? JSON.parse(formatData(enrichedData)) : null
      
      // Extract run_id and run_type from enriched data or context
      let runId = currentRunId || 0
      let runType = currentRunType || 'unknown'
      
      if (enrichedData) {
        // Try to extract from enriched data object
        if (typeof enrichedData === 'object' && enrichedData !== null) {
          if ('courseRequestId' in enrichedData) {
            runId = Number(enrichedData.courseRequestId) || runId
            runType = 'custom-course'
          } else if ('strategyRunId' in enrichedData) {
            runId = Number(enrichedData.strategyRunId) || runId
            runType = 'ai-strategy'
          } else if ('runId' in enrichedData) {
            runId = Number(enrichedData.runId) || runId
          }
          if ('runType' in enrichedData && typeof enrichedData.runType === 'string') {
            runType = enrichedData.runType
          }
        }
      }
      
      await prisma.generationLog.create({
        data: {
          run_id: runId,
          run_type: runType,
          level,
          message: msg,
          meta,
        },
      })
    } catch (err) {
      // Swallow DB logging errors to avoid breaking flow
      console.warn('[GEN][WARN] Failed to write log to DB', err)
    }
  }

  if (!canWriteToFs) {
    return
  }

  // Log to file (always write detailed format)
  try {
    await ensureLogDir()
    await fs.appendFile(LOG_FILE, fileLogMessage)
  } catch (error) {
    // Don't fail if logging fails
    console.error('Failed to write to log file:', error)
  }
}

/**
 * Start timing an operation
 */
export function startTiming(label: string) {
  timings.set(label, Date.now())
  if (!timings.has('start')) {
    timings.set('start', Date.now())
  }
}

/**
 * End timing and log duration
 */
export async function endTiming(label: string, message?: string) {
  const start = timings.get(label)
  if (start) {
    const duration = Date.now() - start
    timings.delete(label)
    const msg = message || `${label} completed`
    await log('info', `${msg} (took ${duration}ms)`)
    return duration
  }
  return 0
}

export const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  error: (message: string, data?: any) => log('error', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  debug: (message: string, data?: any) => log('debug', message, data),
  startTiming,
  endTiming,
}

