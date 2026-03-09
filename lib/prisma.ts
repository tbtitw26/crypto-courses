// lib/prisma.ts - Prisma Client singleton для Next.js

import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL before creating Prisma Client
// NOTE: Don't throw at import-time; allow non-DB parts of the app to work.
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
if (!hasDatabaseUrl) {
  console.warn(
    '⚠️  DATABASE_URL is not set. DB-backed routes will fail or use fallbacks. Set it in .env.'
  )
}

// Check if DATABASE_URL points to localhost (common mistake)
if (process.env.DATABASE_URL?.includes('localhost:5432')) {
  console.warn(
    '⚠️  WARNING: DATABASE_URL points to localhost:5432. ' +
      'If you are using Neon, make sure to use the Neon connection string. ' +
      'Run "npx prisma generate" after updating DATABASE_URL.'
  )
}

// Connection pooling configuration for serverless (Vercel/Neon)
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? (['query', 'error', 'warn'] as Prisma.LogLevel[])
    : (['error'] as Prisma.LogLevel[]),
  // For Neon and other serverless databases, connection pooling is handled via connection string
  // The connection string should include ?pgbouncer=true or use a pooling proxy
  errorFormat: 'minimal',
}

// Create Prisma Client instance
function createPrismaClient(): PrismaClient {
  // PrismaClient will throw on first query/connect if DATABASE_URL is missing.
  const client = new PrismaClient(prismaClientOptions)

  // Handle connection errors gracefully
  client.$on('error' as never, (e: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Prisma] Connection error:', e.message)
    }
  })

  // Handle connection lifecycle
  if (process.env.NODE_ENV === 'development') {
    // Log connection events in development
    process.on('beforeExit', async () => {
      await client.$disconnect()
    })
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export function isPrismaConnectionError(error: any): boolean {
  const code = error?.code as string | undefined
  const name = error?.name as string | undefined
  const message = (error?.message as string | undefined)?.toLowerCase() ?? ''

  // Prisma connection/initialization class errors
  const prismaCodes = new Set([
    'P1000', // Authentication failed
    'P1001', // Can't reach database server
    'P1002', // The database server was reached but timed out
    'P1003', // Database does not exist
    'P1008', // Operations timed out
    'P1010', // Access denied
    'P1011', // TLS connection error
    'P1017', // Server has closed the connection
    'P1018', // Connection limit reached
  ])

  return (
    (code ? prismaCodes.has(code) : false) ||
    name === 'PrismaClientInitializationError' ||
    name === 'PrismaClientConnectionError' ||
    message.includes("can't reach database") ||
    message.includes('can\'t reach database') ||
    message.includes('connection') &&
      (message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('refused') ||
        message.includes('closed') ||
        message.includes('terminated') ||
        message.includes('tls'))
  )
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise

  let t: NodeJS.Timeout | undefined
  const timeout = new Promise<T>((_, reject) => {
    t = setTimeout(() => {
      const err: any = new Error(`${label} timed out after ${timeoutMs}ms`)
      err.code = 'PRISMA_OP_TIMEOUT'
      reject(err)
    }, timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (t) clearTimeout(t)
  }) as Promise<T>
}

// Helper function to handle connection errors with retry
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number
    retryDelayMs?: number
    timeoutMs?: number
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 2
  const retryDelayMs = options?.retryDelayMs ?? 250
  const timeoutMs = options?.timeoutMs ?? 2000

  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs, 'Prisma operation')
    } catch (error: any) {
      lastError = error

      const isConn = isPrismaConnectionError(error) || error?.code === 'PRISMA_OP_TIMEOUT'

      if (isConn && attempt < maxRetries - 1) {
        const delay = retryDelayMs * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw lastError
}
