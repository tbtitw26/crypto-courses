// scripts/generate-course.ts - Script to generate course from JSON input

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env and .env files from project root
config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env'), override: true })

// Check if API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables')
  console.error('Please add OPENAI_API_KEY to your .env file')
  process.exit(1)
}

import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { generateCompleteCourse, resumeCourseGeneration, generateEnglishPdfOnly, generateArabicPdfOnly, CourseGenerationInput } from '../lib/pdf'
import { PrismaClient } from '@prisma/client'
import { loadStatus, updateStatus } from '../lib/pdf/status-tracker'
import { logger } from '../lib/pdf/logger'

const prisma = new PrismaClient()

/**
 * Check if Puppeteer/Chrome is available
 */
async function checkPuppeteerAvailable(): Promise<boolean> {
  try {
    const puppeteer = await import('puppeteer-core')
    // Try to launch browser to check if it's available
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    if (!isServerless) {
      // In local dev, we need Chrome installed
      // Just check if we can import, actual launch will happen later
      return true
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * Display current generation status
 */
async function displayStatus() {
  const status = await loadStatus()
  if (status) {
    console.log('\n📊 Current Status:')
    console.log(`  Stage: ${status.stage}`)
    console.log(`  Progress: ${status.progress}%`)
    console.log(`  Message: ${status.message}`)
    if (status.error) {
      console.log(`  Error: ${status.error}`)
    }
    if (status.courseId) {
      console.log(`  Course ID: ${status.courseId}`)
    }
    console.log('')
  }
}

/**
 * Load and parse course input JSON file
 */
async function loadCourseInput(filePath: string): Promise<CourseGenerationInput> {
  const content = await readFile(filePath, 'utf-8')
  const json = JSON.parse(content)

  // Extract input data from JSON structure
  // The JSON might be in OpenAI request format or direct input format
  let input: CourseGenerationInput

  if (json.input && Array.isArray(json.input)) {
    // OpenAI request format - extract from user prompt
    const userMessage = json.input.find((msg: any) => msg.role === 'user')
    if (userMessage && userMessage.content) {
      const content = Array.isArray(userMessage.content)
        ? userMessage.content.find((c: any) => c.type === 'text')?.text || ''
        : userMessage.content

      // Parse course data from prompt text
      // This is a simplified parser - adjust based on actual format
      input = {
        course_title: extractField(content, 'Course title:'),
        short_description: extractField(content, 'Short description:'),
        target_audience: extractList(content, 'Target audience:'),
        markets_covered: extractList(content, 'Markets covered'),
        must_cover_topics: extractNumberedList(content, 'MUST-COVER TOPICS:'),
        deliverable_requirements: extractList(content, 'DELIVERABLE REQUIREMENTS:'),
        quality_bar: extractField(content, 'QUALITY BAR:'),
        intended_pages_range: extractField(content, 'intended_pages_range') || '25-40',
        level: (extractField(content, 'LEVEL:') || 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
      }
    } else {
      throw new Error('Invalid JSON format: user message not found')
    }
  } else {
    // Direct input format
    input = json as CourseGenerationInput
  }

  // Validate required fields
  if (!input.course_title || !input.short_description || !input.target_audience || !input.markets_covered || !input.must_cover_topics) {
    throw new Error('Missing required fields in input JSON')
  }

  return input
}

function extractField(text: string, label: string): string {
  const regex = new RegExp(`${label}\\s*([^\\n]+)`, 'i')
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

function extractList(text: string, label: string): string[] {
  const regex = new RegExp(`${label}[^\\n]*\\n((?:[-•]\\s*[^\\n]+\\n?)+)`, 'i')
  const match = text.match(regex)
  if (!match) return []
  
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter((line) => line.length > 0)
}

function extractNumberedList(text: string, label: string): string[] {
  const regex = new RegExp(`${label}[^\\n]*\\n((?:\\d+\\)\\s*[^\\n]+\\n?)+)`, 'i')
  const match = text.match(regex)
  if (!match) return []
  
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\d+\)\s*/, '').trim())
    .filter((line) => line.length > 0)
}

/**
 * Save course to database
 */
async function saveCourseToDatabase(result: Awaited<ReturnType<typeof generateCompleteCourse>>) {
  try {
    const course = await prisma.course.create({
      data: {
        title: result.courseEn.cover.title,
        description: result.courseEn.cover.subtitle,
        slug: result.courseId,
        level: 'Beginner', // Default, should be set based on course content
        market: 'General', // Default, should be set based on course content
        price_gbp: 0, // Will be set manually
        tokens: 0, // Will be set manually
        pdf_path: result.pdfEnPath,
        cover_image: result.coverImagePath,
        // Add other fields as needed
      },
    })
    console.log(`Course saved to database with ID: ${course.id}`)
    return course
  } catch (error) {
    console.error('Failed to save course to database:', error)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('Usage: tsx scripts/generate-course.ts <input-json-file> [options]')
    console.error('Options:')
    console.error('  --status          Show current generation status and exit')
    console.error('  --resume          Resume generation from saved intermediate files (if available)')
    console.error('  --pdf-en-only     Generate only English PDF from existing data')
    console.error('  --pdf-ar-only     Generate only Arabic PDF (will translate if needed)')
    console.error('  --skip-translation Skip translation and generate only English PDF')
    process.exit(1)
  }

  // Check for --status flag
  if (args.includes('--status')) {
    await displayStatus()
    process.exit(0)
  }

  const inputFile = args[0]
  const inputPath = join(process.cwd(), inputFile)
  const resumeFlag = args.includes('--resume')
  const pdfEnOnlyFlag = args.includes('--pdf-en-only')
  const pdfArOnlyFlag = args.includes('--pdf-ar-only')
  const skipTranslationFlag = args.includes('--skip-translation')

  try {
    // Check Puppeteer availability
    const puppeteerAvailable = await checkPuppeteerAvailable()
    if (!puppeteerAvailable) {
      await logger.warn('Puppeteer may not be available. PDF generation might fail.')
    }

    // Handle PDF-only generation flags FIRST (before resume check)
    if (pdfEnOnlyFlag || pdfArOnlyFlag) {
      const status = await loadStatus()
      const courseId = status?.courseId
      
      if (!courseId) {
        // Try to find course ID from temp files
        const tempDir = join(process.cwd(), 'public', 'courses', 'temp')
        try {
          const tempFiles = await readdir(tempDir)
          const enCourseFile = tempFiles.find(f => f.endsWith('-en.json'))
          if (enCourseFile) {
            const foundCourseId = enCourseFile.replace('-en.json', '')
            
            if (pdfEnOnlyFlag) {
              await logger.info(`📄 Generating English PDF only for course: ${foundCourseId}`)
              const result = await generateEnglishPdfOnly(foundCourseId)
              await logger.info(`✅ English PDF generated: ${result.pdfEnPath}`)
              console.log(`\n✅ English PDF generated: ${result.pdfEnPath}`)
              return
            } else if (pdfArOnlyFlag) {
              await logger.info(`📄 Generating Arabic PDF only for course: ${foundCourseId}`)
              const result = await generateArabicPdfOnly(foundCourseId)
              await logger.info(`✅ Arabic PDF generated: ${result.pdfArPath}`)
              console.log(`\n✅ Arabic PDF generated: ${result.pdfArPath}`)
              return
            }
          }
        } catch (error) {
          // Temp directory doesn't exist
        }
        
        await logger.error('❌ No course ID found. Please run full generation first or provide course ID.')
        console.error('❌ No course ID found. Please run full generation first.')
        process.exit(1)
      }
      
      if (pdfEnOnlyFlag) {
        await logger.info(`📄 Generating English PDF only for course: ${courseId}`)
        const result = await generateEnglishPdfOnly(courseId)
        await logger.info(`✅ English PDF generated: ${result.pdfEnPath}`)
        console.log(`\n✅ English PDF generated: ${result.pdfEnPath}`)
        return
      } else if (pdfArOnlyFlag) {
        await logger.info(`📄 Generating Arabic PDF only for course: ${courseId}`)
        const result = await generateArabicPdfOnly(courseId)
        await logger.info(`✅ Arabic PDF generated: ${result.pdfArPath}`)
        console.log(`\n✅ Arabic PDF generated: ${result.pdfArPath}`)
        return
      }
    }

    // Check if we should resume from saved point
    const status = await loadStatus()
    
    // Check if there's a saved course file even if status was cleared
    const tempDir = join(process.cwd(), 'public', 'courses', 'temp')
    let savedCourseId: string | null = null
    try {
      const tempFiles = await readdir(tempDir)
      const enCourseFile = tempFiles.find(f => f.endsWith('-en.json'))
      if (enCourseFile) {
        savedCourseId = enCourseFile.replace('-en.json', '')
      }
    } catch (error) {
      // Temp directory doesn't exist, no saved course
    }
    
    const shouldResume = resumeFlag || (status && status.stage === 'error' && status.courseId) || savedCourseId
    
    if (shouldResume && (status?.courseId || savedCourseId)) {
      const courseIdToResume = status?.courseId || savedCourseId!
      await logger.info(`🔄 Resuming generation for course: ${courseIdToResume}`)
      await logger.info('You can check progress by running: npm run generate-course -- --status')
      
      // Show status every 5 seconds
      const statusInterval = setInterval(async () => {
        await displayStatus()
      }, 5000)

      const result = await resumeCourseGeneration(courseIdToResume)
      
      clearInterval(statusInterval)

      await logger.info('\n=== Generation Complete ===')
      await logger.info(`Course ID: ${result.courseId}`)
      await logger.info(`Cover Image: ${result.coverImagePath}`)
      await logger.info(`English PDF: ${result.pdfEnPath}`)
      if (result.pdfArPath) {
        await logger.info(`Arabic PDF: ${result.pdfArPath}`)
      } else {
        await logger.warn('⚠️ Arabic PDF was not generated (translation may have failed)')
      }
      if (result.warnings && result.warnings.length > 0) {
        await logger.warn('⚠️ Warnings:', result.warnings)
        console.warn('\n⚠️ Warnings:')
        result.warnings.forEach(w => console.warn(`  - ${w}`))
      }
      await logger.info(`Diagrams: ${Object.keys(result.diagramImagePaths).length} generated`)

      // Save to database
      await logger.info('\nSaving to database...')
      await saveCourseToDatabase(result)

      await logger.info('\n✅ Course generation completed successfully!')
      console.log('\n✅ Course generation completed successfully!')
      console.log(`📄 Check logs at: logs/course-generation.log`)
      console.log(`📊 Status file: public/courses/.generation-status.json`)
      return
    }

    await logger.info(`Loading input from: ${inputPath}`)
    const input = await loadCourseInput(inputPath)

    await logger.info('Starting course generation...')
    await logger.info('You can check progress by running: npm run generate-course -- --status')
    
    // Show status every 5 seconds
    const statusInterval = setInterval(async () => {
      await displayStatus()
    }, 5000)

    const result = await generateCompleteCourse(input)
    
    clearInterval(statusInterval)

    await logger.info('\n=== Generation Complete ===')
    await logger.info(`Course ID: ${result.courseId}`)
    await logger.info(`Cover Image: ${result.coverImagePath}`)
    await logger.info(`English PDF: ${result.pdfEnPath}`)
    if (result.pdfArPath) {
      await logger.info(`Arabic PDF: ${result.pdfArPath}`)
    } else {
      await logger.warn('⚠️ Arabic PDF was not generated (translation may have failed)')
    }
    if (result.warnings && result.warnings.length > 0) {
      await logger.warn('⚠️ Warnings:', result.warnings)
      console.warn('\n⚠️ Warnings:')
      result.warnings.forEach(w => console.warn(`  - ${w}`))
    }
    await logger.info(`Diagrams: ${Object.keys(result.diagramImagePaths).length} generated`)

    // Save to database
    await logger.info('\nSaving to database...')
    await saveCourseToDatabase(result)

    await logger.info('\n✅ Course generation completed successfully!')
    console.log('\n✅ Course generation completed successfully!')
    console.log(`📄 Check logs at: logs/course-generation.log`)
    console.log(`📊 Status file: public/courses/.generation-status.json`)
  } catch (error) {
    await logger.error('❌ Error generating course:', error)
    console.error('❌ Error generating course:', error)
    console.error(`📄 Check detailed logs at: logs/course-generation.log`)
    await displayStatus()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

