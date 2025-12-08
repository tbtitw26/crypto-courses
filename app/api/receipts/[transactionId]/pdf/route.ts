// app/api/receipts/[transactionId]/pdf/route.ts - API endpoint for generating PDF receipts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { generateReceiptPdf } from '@/lib/receipts/pdf-generator'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId } = await params

    // Fetch receipt data
    const receiptResponse = await fetch(
      `${request.nextUrl.origin}/api/receipts/${transactionId}`,
      {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      }
    )

    if (!receiptResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch receipt data' },
        { status: receiptResponse.status }
      )
    }

    const receiptData = await receiptResponse.json()

    // Generate PDF
    const pdfBuffer = await generateReceiptPdf(receiptData)

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'PDF generation failed. Please try again later.' },
        { status: 503 }
      )
    }

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${transactionId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('[Receipts PDF API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

