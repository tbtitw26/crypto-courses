// lib/receipts/pdf-generator.ts - PDF receipt generation using Puppeteer

import puppeteer from 'puppeteer-core'
import { formatPrice, convertAmount } from '@/lib/currency-utils'
import { config } from '@/lib/config'

interface ReceiptData {
  id: string
  type: string
  invoiceNumber: string
  date: string | Date
  amount: number
  tokens: number
  description: string
  markets?: string[]
  user: {
    first_name: string
    last_name: string | null
    email: string
  }
}

/**
 * Connect to Browserless.io for remote Chrome
 */
async function connectToBrowserless(): Promise<ReturnType<typeof puppeteer.connect> | null> {
  const { apiKey, endpoint } = config.browserless
  if (!apiKey) {
    console.log('[Receipts] No BROWSERLESS_API_KEY found, cannot use remote browser')
    return null
  }

  const browserWSEndpoint = `${endpoint}?token=${apiKey}`
  console.log('[Receipts] Connecting to Browserless.io...')

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint,
    })
    console.log('[Receipts] Connected to Browserless.io successfully')
    return browser
  } catch (error) {
    console.error('[Receipts] Failed to connect to Browserless.io:', error)
    return null
  }
}

/**
 * Try to launch local Chrome (for development)
 */
async function launchLocalChrome(): Promise<ReturnType<typeof puppeteer.launch> | null> {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    process.env.CHROME_PATH,
  ].filter(Boolean) as string[]

  // First try without explicit path
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    console.log('[Receipts] Local Chrome launched successfully')
    return browser
  } catch (e) {
    // Try with explicit paths
  }

  for (const chromePath of possiblePaths) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      console.log('[Receipts] Local Chrome launched from:', chromePath)
      return browser
    } catch (e) {
      // Try next path
    }
  }

  console.log('[Receipts] No local Chrome found')
  return null
}

/**
 * Generate PDF receipt from receipt data
 * Returns null if PDF generation fails (allows graceful degradation)
 */
export async function generateReceiptPdf(receiptData: ReceiptData): Promise<Buffer | null> {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  let browser: Awaited<ReturnType<typeof puppeteer.connect>> | null = null

  try {
    // Strategy:
    // 1. On Vercel/serverless: use Browserless.io (remote Chrome)
    // 2. On local dev: try local Chrome first, fallback to Browserless if available
    if (isServerless) {
      // Serverless: must use Browserless
      browser = await connectToBrowserless()
      if (!browser) {
        console.error('[Receipts] Cannot generate PDF: no Browserless API key on serverless')
        return null
      }
    } else {
      // Local dev: try local Chrome first
      browser = await launchLocalChrome()
      if (!browser) {
        // Fallback to Browserless if available
        browser = await connectToBrowserless()
      }
      if (!browser) {
        console.error('[Receipts] Cannot generate PDF: no Chrome available locally or remotely')
        return null
      }
    }

    const page = await browser.newPage()

    // Generate HTML for receipt
    const html = generateReceiptHtml(receiptData)

    const setContentWithRetry = async () => {
      try {
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 60000, // 60s
        })
      } catch (err: any) {
        if (err?.name === 'TimeoutError') {
          console.warn('[Receipts] setContent timeout, retrying once...')
          await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 60000,
          })
        } else {
          throw err
        }
      }
    }

    await setContentWithRetry()

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 60000, // 60s
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    })

    // For remote browser (Browserless), we disconnect instead of close
    if (isServerless) {
      await browser.disconnect()
    } else {
      await browser.close()
    }

    console.log('[Receipts] PDF generated successfully')
    return pdfBuffer
  } catch (error) {
    console.error('[Receipts] Failed to generate receipt PDF:', error)
    if (browser) {
      try {
        if (isServerless) {
          await browser.disconnect()
        } else {
          await browser.close()
        }
      } catch (closeError) {
        console.error('[Receipts] Error closing browser:', closeError)
      }
    }
    return null
  }
}

/**
 * Generate HTML for receipt
 */
function generateReceiptHtml(receiptData: ReceiptData): string {
  const date = new Date(receiptData.date)
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const userName = `${receiptData.user.first_name} ${receiptData.user.last_name || ''}`.trim()
  const amountGbp = receiptData.amount
  const amountEur = convertAmount(amountGbp, 'GBP', 'EUR')
  const amountUsd = convertAmount(amountGbp, 'GBP', 'USD')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt ${receiptData.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      padding: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #06b6d4;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #475569;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-row {
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: 600;
      color: #64748b;
      margin-bottom: 2px;
    }
    .info-value {
      color: #1e293b;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .items-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .total-row {
      background: #f8fafc;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
      text-align: center;
    }
    .company-info {
      margin-top: 20px;
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="logo">Cur Nova</div>
        <div class="company-info">
          CUR NOVA LTD<br>
          Company Number: 17240836<br>
          Dept 6831, 196 High Road, Wood Green, London, N22 8HH
        </div>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">${receiptData.invoiceNumber}</div>
        <div>Date: ${formattedDate}</div>
      </div>
    </div>

    <div class="two-columns">
      <div class="section">
        <div class="section-title">Bill To</div>
        <div class="info-row">
          <div class="info-label">Name</div>
          <div class="info-value">${userName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email</div>
          <div class="info-value">${receiptData.user.email}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="info-row">
          <div class="info-label">Type</div>
          <div class="info-value">${receiptData.type}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Description</div>
          <div class="info-value">${receiptData.description}</div>
        </div>
        ${receiptData.markets ? `
        <div class="info-row">
          <div class="info-label">Markets</div>
          <div class="info-value">${receiptData.markets.join(', ')}</div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Items</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Tokens</th>
            <th class="text-right">Amount (GBP)</th>
            <th class="text-right">Amount (EUR)</th>
            <th class="text-right">Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${receiptData.description}</td>
            <td class="text-right">${receiptData.tokens > 0 ? '+' : ''}${receiptData.tokens.toLocaleString('en-US')}</td>
            <td class="text-right">${amountGbp > 0 ? formatPrice(amountGbp, 'GBP') : '—'}</td>
            <td class="text-right">${amountGbp > 0 ? formatPrice(amountEur, 'EUR') : '—'}</td>
            <td class="text-right">${amountGbp > 0 ? formatPrice(amountUsd, 'USD') : '—'}</td>
          </tr>
          ${amountGbp > 0 ? `
          <tr class="total-row">
            <td colspan="4" class="text-right">Total:</td>
            <td class="text-right">${formatPrice(amountGbp, 'GBP')}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p><strong>Education Only</strong> – This receipt is for educational content only. Cur Nova does not provide trading signals or manage trading accounts.</p>
      <p style="margin-top: 10px;">For billing questions, contact support with your account email. Never share full card details.</p>
    </div>
  </div>
</body>
</html>`
}
