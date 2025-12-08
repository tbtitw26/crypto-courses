// lib/pdf/logger.ts - File-based logging for course generation

import fs from 'fs/promises'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'course-generation.log')
const canWriteToFs = !(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

// Ensure log directory exists
async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true })
  } catch (error) {
    // Ignore if directory already exists
  }
}

/**
 * Log message to both console and file
 */
export async function log(level: 'info' | 'error' | 'warn' | 'debug', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}\n`

  // Log to console
  if (level === 'error') {
    console.error(message, data || '')
  } else if (level === 'warn') {
    console.warn(message, data || '')
  } else {
    console.log(message, data || '')
  }

  if (!canWriteToFs) {
    return
  }

  // Log to file
  try {
    await ensureLogDir()
    await fs.appendFile(LOG_FILE, logMessage)
  } catch (error) {
    // Don't fail if logging fails
    console.error('Failed to write to log file:', error)
  }
}

export const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  error: (message: string, data?: any) => log('error', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  debug: (message: string, data?: any) => log('debug', message, data),
}

