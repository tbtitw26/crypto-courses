// lib/receipts/pdf-generator.ts - PDF receipt generation using Puppeteer

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { formatPrice, convertAmount } from '@/lib/currency-utils'

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
 * Generate PDF receipt from receipt data
 */
export async function generateReceiptPdf(receiptData: ReceiptData): Promise<Buffer> {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

  // Ensure Chromium runs in Lambda/Vercel
  chromium.setHeadlessMode = true
  chromium.setGraphicsMode = false

  let browser
  try {
    if (isServerless) {
      // Serverless environment - use Chromium
      const executablePath = await chromium.executablePath('/tmp')
      console.log('[Receipts] Using Chromium path:', executablePath)
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless === 'new' ? true : chromium.headless,
        ignoreHTTPSErrors: true,
      })
    } else {
      // Local development - use system Chrome/Chromium
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
      } catch (launchError) {
        const possiblePaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.CHROME_PATH,
        ].filter(Boolean)

        let launched = false
        for (const chromePath of possiblePaths) {
          try {
            browser = await puppeteer.launch({
              headless: true,
              executablePath: chromePath,
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
            })
            launched = true
            break
          } catch (e) {
            // Try next path
          }
        }

        if (!launched) {
          throw new Error(
            'Chrome/Chromium not found. Please install Chrome or set CHROME_PATH environment variable.'
          )
        }
      }
    }

    if (!browser) {
      throw new Error('Failed to launch browser')
    }

    const page = await browser.newPage()

    // Generate HTML for receipt
    const html = generateReceiptHtml(receiptData)

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    })

    await browser.close()

    return pdfBuffer
  } catch (error) {
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Error closing browser:', closeError)
      }
    }
    console.error('Failed to generate receipt PDF:', error)
    throw error
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
  const amountSr = convertAmount(amountGbp, 'GBP', 'SR')

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
        <div class="logo">Avenqor</div>
        <div class="company-info">
          OVERSEAS SUPPORT LIMITED<br>
          Company Number: 15969862<br>
          31 Auctioneers Way, Northampton, United Kingdom, NN1 1HF
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
            <th class="text-right">Amount (SR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${receiptData.description}</td>
            <td class="text-right">${receiptData.tokens > 0 ? '+' : ''}${receiptData.tokens.toLocaleString('en-US')}</td>
            <td class="text-right">${amountGbp > 0 ? formatPrice(amountGbp, 'GBP') : '—'}</td>
            <td class="text-right">${amountGbp > 0 ? formatPrice(amountEur, 'EUR') : '—'}</td>
            <td class="text-right">${amountGbp > 0 ? formatPrice(amountUsd, 'USD') : '—'}</td>
            <td class="text-right">${amountGbp > 0 ? formatPrice(amountSr, 'SR') : '—'}</td>
          </tr>
          ${amountGbp > 0 ? `
          <tr class="total-row">
            <td colspan="5" class="text-right">Total:</td>
            <td class="text-right">${formatPrice(amountGbp, 'GBP')}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p><strong>Education Only</strong> – This receipt is for educational content only. Avenqor does not provide trading signals or manage trading accounts.</p>
      <p style="margin-top: 10px;">For billing questions, contact support with your account email. Never share full card details.</p>
    </div>
  </div>
</body>
</html>`
}

