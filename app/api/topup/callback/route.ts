import { NextRequest, NextResponse } from 'next/server'
import { processArmenotechCallback } from '@/lib/topup-payment-flow'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

async function readCallbackBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return request.json()
  }

  const text = await request.text()

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(text).entries())
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readCallbackBody(request)
    const result = await processArmenotechCallback(body)

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          referenceId: result.referenceId,
        },
        { status: result.error === 'Invalid callback signature' ? 401 : 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Top-up Callback API] Error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process callback',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const body = Object.fromEntries(request.nextUrl.searchParams.entries())
    const result = await processArmenotechCallback(body)

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          referenceId: result.referenceId,
        },
        { status: result.error === 'Invalid callback signature' ? 401 : 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Top-up Callback API] GET Error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process callback',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
