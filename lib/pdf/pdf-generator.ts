// lib/pdf/pdf-generator.ts - PDF generation using Puppeteer

import puppeteer from 'puppeteer-core'
import { saveCoursePdf } from '@/lib/storage'
import { GeneratedCourse } from './types'
import { generateCourseHtml } from './templates'
import { logger } from './logger'
import { config } from '@/lib/config'
import path from 'path'
import fs from 'fs/promises'

/**
 * Connect to Browserless.io for remote Chrome
 */
async function connectToBrowserless(): Promise<ReturnType<typeof puppeteer.connect> | null> {
  const { apiKey, endpoint } = config.browserless
  if (!apiKey) {
    await logger.info('[PDF] No BROWSERLESS_API_KEY found, cannot use remote browser')
    return null
  }

  const browserWSEndpoint = `${endpoint}?token=${apiKey}`
  await logger.info('[PDF] Connecting to Browserless.io...')

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint,
    })
    await logger.info('[PDF] Connected to Browserless.io successfully')
    return browser
  } catch (error) {
    await logger.error('[PDF] Failed to connect to Browserless.io:', error)
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
    await logger.info('[PDF] Local Chrome launched successfully')
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
      await logger.info(`[PDF] Local Chrome launched from: ${chromePath}`)
      return browser
    } catch (e) {
      // Try next path
    }
  }

  await logger.info('[PDF] No local Chrome found')
  return null
}

/**
 * Generate PDF from course HTML using Puppeteer
 * Supports two-pass rendering for Table of Contents
 */
export async function generateCoursePdf(
  course: GeneratedCourse,
  coverImagePath: string,
  diagramPaths: Record<string, { publicPath: string; localPath?: string }>,
  courseId: string,
  language: 'EN' | 'AR'
): Promise<{ publicPath: string; buffer: Buffer }> {
  const isArabic = language === 'AR'
  // Convert diagramPaths to simple string map for HTML generation
  const diagramPathsMap = Object.fromEntries(
    Object.entries(diagramPaths).map(([id, paths]) => [id, paths.localPath || paths.publicPath])
  )
  const html = generateCourseHtml(course, coverImagePath, diagramPathsMap, isArabic)

  // Determine if we're in serverless environment
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
        throw new Error('Cannot generate PDF: no BROWSERLESS_API_KEY on serverless environment')
      }
    } else {
      // Local dev: try local Chrome first
      browser = await launchLocalChrome()
      if (!browser) {
        // Fallback to Browserless if available
        browser = await connectToBrowserless()
      }
      if (!browser) {
        throw new Error(
          'Chrome/Chromium not found. Please install Chrome, set CHROME_PATH, or provide BROWSERLESS_API_KEY.'
        )
      }
    }

    const page = await browser.newPage()

    // Set content with base64 images or file paths
    // For local development, use file:// protocol
    // For serverless, we need to inline images as base64
    const htmlWithImages = await prepareHtmlWithImages(html, coverImagePath, diagramPaths, isServerless)

    // Set timeout for page content loading (default is 30 seconds, increase for large courses)
    const pdfTimeout = config.openai.timeouts.pdf || 120000
    page.setDefaultTimeout(pdfTimeout)
    
    await page.setContent(htmlWithImages, {
      waitUntil: 'networkidle0',
      timeout: pdfTimeout,
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '18mm',
        right: '16mm',
        bottom: '18mm',
        left: '16mm',
      },
      preferCSSPageSize: true,
    })

    // For remote browser (Browserless), we disconnect instead of close
    if (isServerless) {
      await browser.disconnect()
    } else {
      await browser.close()
    }

    // Save PDF
    const filename = `${courseId}-${language.toLowerCase()}.pdf`
    const { publicPath } = await saveCoursePdf(pdfBuffer, filename)

    await logger.info(`[PDF] Generated ${language} PDF: ${publicPath}`)

    return {
      publicPath,
      buffer: pdfBuffer,
    }
  } catch (error) {
    if (browser) {
      try {
        if (isServerless) {
          await browser.disconnect()
        } else {
          await browser.close()
        }
      } catch (closeError) {
        console.error('Error closing browser:', closeError)
      }
    }
    console.error(`Failed to generate PDF for ${language}:`, error)
    throw error
  }
}

/**
 * Prepare HTML with images - convert to base64 for serverless or use file paths for local
 */
async function prepareHtmlWithImages(
  html: string,
  coverImagePath: string,
  diagramPaths: Record<string, { publicPath: string; localPath?: string }>,
  isServerless: boolean
): Promise<string> {
  const publicPath = path.join(process.cwd(), 'public')
  let processedHtml = html
  
  // Always use base64 for images to ensure compatibility (works in both local and serverless)
  // This is more reliable than file:// paths which can have issues with Puppeteer
  
  // Convert logo to base64 (used in cover and header)
  const logoPath = '/avenqor.webp'
  try {
    const logoFullPath = path.join(publicPath, logoPath.replace(/^\//, ''))
    await logger.info(`Loading logo from: ${logoFullPath}`)
    
    await fs.access(logoFullPath)
    const logoBuffer = await fs.readFile(logoFullPath)
    const logoBase64 = logoBuffer.toString('base64')
    const logoDataUrl = `data:image/webp;base64,${logoBase64}`
    
    // Replace logo in HTML (both in cover and CSS @page)
    // Replace in CSS background-image
    processedHtml = processedHtml.replace(/background-image:\s*url\(\/avenqor\.webp\)/g, `background-image: url(${logoDataUrl})`)
    // Replace in img src
    processedHtml = processedHtml.replace(/src="\/avenqor\.webp"/g, `src="${logoDataUrl}"`)
    
    await logger.info(`Logo converted to base64 (${logoBuffer.length} bytes)`)
  } catch (error) {
    await logger.error(`Failed to load logo: ${logoPath}`, error)
    // Don't throw - continue without logo
  }
  
  const replaceImageWithDataUrl = (htmlContent: string, originalPath: string, dataUrl: string) => {
    const escapedPath = originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return htmlContent.replace(new RegExp(escapedPath, 'g'), dataUrl)
  }

  async function loadImageAsDataUrl(imagePath: string): Promise<string | null> {
    if (!imagePath) return null

    const isRemote = imagePath.startsWith('http://') || imagePath.startsWith('https://')
    const isLocal = imagePath.startsWith('/')

    try {
      if (isRemote) {
        const response = await fetch(imagePath)
        if (!response.ok) {
          throw new Error(`Failed to fetch remote image: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const mimeType =
          response.headers.get('content-type') ||
          (imagePath.endsWith('.png')
            ? 'image/png'
            : imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/webp')
        const base64Image = Buffer.from(arrayBuffer).toString('base64')
        return `data:${mimeType};base64,${base64Image}`
      }

      if (isLocal) {
        const filePath = path.join(publicPath, imagePath.replace(/^\//, ''))
        await fs.access(filePath)
        const imageBuffer = await fs.readFile(filePath)
        const mimeType =
          imagePath.endsWith('.png')
            ? 'image/png'
            : imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/webp'
        const base64Image = imageBuffer.toString('base64')
        return `data:${mimeType};base64,${base64Image}`
      }
    } catch (error) {
      await logger.error(`Failed to load image for PDF: ${imagePath}`, error)
      return null
    }

    return null
  }

  const coverDataUrl = await loadImageAsDataUrl(coverImagePath)
  if (coverDataUrl) {
    processedHtml = replaceImageWithDataUrl(processedHtml, coverImagePath, coverDataUrl)
  }

  for (const [diagramId, paths] of Object.entries(diagramPaths)) {
    const diagramPath = paths.localPath || paths.publicPath
    const dataUrl = await loadImageAsDataUrl(diagramPath)
    if (dataUrl) {
      processedHtml = replaceImageWithDataUrl(processedHtml, diagramPath, dataUrl)
      await logger.info(`Diagram ${diagramId} converted to base64`)
    } else if (diagramPath) {
      await logger.error(`Failed to convert diagram ${diagramId} at ${diagramPath} to base64`)
    }
  }
  
  return processedHtml
}
