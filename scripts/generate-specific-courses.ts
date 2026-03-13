// scripts/generate-specific-courses.ts - Script to generate specific courses by index from a batch file

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

import { readFile } from 'fs/promises'
import { join } from 'path'
import { generateCompleteCourse, CourseGenerationInput, generateEnglishPdfOnly } from '../lib/pdf'
import { logger } from '../lib/pdf/logger'

/**
 * Generate course ID from title (same logic as in generator.ts)
 */
function generateCourseId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

/**
 * Parse course request text to extract course data
 * Supports both formats: numbered list (1) topic) and dashes (- topic)
 */
function parseCourseRequest(text: string): CourseGenerationInput {
  // Extract course title
  const titleMatch = text.match(/Course title:\s*(.+?)(?:\n|$)/i)
  const course_title = titleMatch ? titleMatch[1].trim() : ''

  // Extract short description
  const descMatch = text.match(/Short description:\s*(.+?)(?:\n\n|Target audience:)/is)
  const short_description = descMatch ? descMatch[1].trim() : ''

  // Extract target audience (list items)
  const audienceMatch = text.match(/Target audience:\s*((?:- .+?\n?)+?)(?:\n\n|Markets covered:)/is)
  const target_audience: string[] = []
  if (audienceMatch) {
    const audienceText = audienceMatch[1]
    const audienceItems = audienceText.match(/- (.+?)(?:\n|$)/g)
    if (audienceItems) {
      target_audience.push(...audienceItems.map(item => item.replace(/^- /, '').trim()))
    }
  }

  // Extract markets covered
  const marketsMatch = text.match(/Markets covered[^:]*:\s*((?:- .+?\n?)+?)(?:\n\n|MUST-COVER)/is)
  const markets_covered: string[] = []
  if (marketsMatch) {
    const marketsText = marketsMatch[1]
    const marketItems = marketsText.match(/- (.+?)(?:\n|$)/g)
    if (marketItems) {
      markets_covered.push(...marketItems.map(item => item.replace(/^- /, '').trim()))
    }
  }

  // Extract MUST-COVER TOPICS
  // Support both formats: numbered list (1) topic) and dashes (- topic)
  const topicsMatch = text.match(/MUST-COVER TOPICS[^:]*:\s*((?:[\d\)\-].+?\n?)+?)(?:\n\n|DELIVERABLE)/is)
  const must_cover_topics: string[] = []
  if (topicsMatch) {
    const topicsText = topicsMatch[1]
    // Try numbered format first (1) topic)
    let topicItems = topicsText.match(/\d+\) (.+?)(?:\n|$)/g)
    if (topicItems && topicItems.length > 0) {
      must_cover_topics.push(...topicItems.map(item => item.replace(/^\d+\) /, '').trim()))
    } else {
      // Fall back to dash format (- topic)
      topicItems = topicsText.match(/- (.+?)(?:\n|$)/g)
      if (topicItems) {
        must_cover_topics.push(...topicItems.map(item => item.replace(/^- /, '').trim()))
      }
    }
  }

  // Extract DELIVERABLE REQUIREMENTS
  const deliverableMatch = text.match(/DELIVERABLE REQUIREMENTS[^:]*:\s*((?:\d+\) .+?\n?)+?)(?:\n\n|QUALITY)/is)
  const deliverable_requirements: string[] = []
  if (deliverableMatch) {
    const deliverableText = deliverableMatch[1]
    const deliverableItems = deliverableText.match(/\d+\) (.+?)(?:\n|$)/g)
    if (deliverableItems) {
      deliverable_requirements.push(...deliverableItems.map(item => item.replace(/^\d+\) /, '').trim()))
    }
  }

  // Extract QUALITY BAR
  const qualityMatch = text.match(/QUALITY BAR:\s*(.+?)(?:\n\n|NOTES:|Additional|$)/is)
  const quality_bar = qualityMatch ? qualityMatch[1].trim() : undefined

  // Determine level from title/description (default: Beginner)
  let level: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner'
  const titleLower = course_title.toLowerCase()
  const descLower = short_description.toLowerCase()
  if (titleLower.includes('advanced') || descLower.includes('advanced')) {
    level = 'Advanced'
  } else if (titleLower.includes('intermediate') || descLower.includes('intermediate')) {
    level = 'Intermediate'
  }

  return {
    course_title,
    short_description,
    target_audience,
    markets_covered,
    must_cover_topics,
    deliverable_requirements: deliverable_requirements.length > 0 ? deliverable_requirements : undefined,
    quality_bar,
    intended_pages_range: '25-40',
    level,
  }
}

/**
 * Main function
 */
async function main() {
  // Get input file and course indices from command line arguments
  const args = process.argv.slice(2)
  const pdfEnOnlyFlag = args.includes('--pdf-en-only')
  const filteredArgs = args.filter(arg => arg !== '--pdf-en-only')
  const inputFile = filteredArgs[0]
  const courseIndices = filteredArgs.slice(1).map(idx => parseInt(idx, 10)).filter(idx => !isNaN(idx))

  if (!inputFile) {
    console.error('❌ Usage: npm run generate-specific-courses <input-file> <course-index-1> [course-index-2] ...')
    console.error('Example: npm run generate-specific-courses avenqor-course-requests-07-16.json 11 13')
    process.exit(1)
  }

  if (courseIndices.length === 0) {
    console.error('❌ Please provide at least one course index')
    process.exit(1)
  }

  const inputPath = join(process.cwd(), inputFile)

  try {
    console.log(`📖 Reading course requests from: ${inputFile}`)
    console.log(`🎯 Generating courses with indices: ${courseIndices.join(', ')}\n`)
    
    const fileContent = await readFile(inputPath, 'utf-8')
    const data = JSON.parse(fileContent)

    if (!data.requests || !Array.isArray(data.requests)) {
      throw new Error('Invalid file format: expected "requests" array')
    }

    const courses = data.requests
    const coursesToGenerate = courses.filter((course: any) => {
      const courseIndex = course.course_index || courses.indexOf(course) + 1
      return courseIndices.includes(courseIndex)
    })

    if (coursesToGenerate.length === 0) {
      console.error(`❌ No courses found with indices: ${courseIndices.join(', ')}`)
      process.exit(1)
    }

    console.log(`✅ Found ${coursesToGenerate.length} course(s) to generate\n`)

    // Track statistics
    let successCount = 0
    let errorCount = 0

    // Process each course sequentially
    for (let i = 0; i < coursesToGenerate.length; i++) {
      const courseRequest = coursesToGenerate[i]
      const courseIndex = courseRequest.course_index || (courses.indexOf(courseRequest) + 1)
      const courseTitleFromMeta = courseRequest.course_title || null
      const courseId = courseRequest.id || `course-${courseIndex}`
      
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📚 Course ${courseIndex}: ${courseTitleFromMeta || courseId}`)
      console.log(`${'='.repeat(60)}\n`)

      try {
        // Extract user prompt text
        const userContent = courseRequest.request?.input?.find(
          (item: any) => item.role === 'user'
        )?.content?.[0]?.text

        if (!userContent) {
          throw new Error('No user content found in request')
        }

        // Parse course data from text
        const courseInput = parseCourseRequest(userContent)
        
        // Use course_title from meta if available (new format)
        if (courseTitleFromMeta && courseTitleFromMeta !== courseInput.course_title) {
          console.log(`📝 Course Title (from meta): ${courseTitleFromMeta}`)
          courseInput.course_title = courseTitleFromMeta
        } else {
          console.log(`📝 Course Title: ${courseInput.course_title}`)
        }
        
        console.log(`📋 Description: ${courseInput.short_description.substring(0, 80)}...`)
        console.log(`🎯 Level: ${courseInput.level}`)
        console.log(`📊 Markets: ${courseInput.markets_covered.join(', ')}`)
        console.log(`\n🚀 Starting generation...\n`)

        // Generate course or PDF only
        let result: any
        if (pdfEnOnlyFlag) {
          // Generate only English PDF from existing course data
          const courseIdForPdf = generateCourseId(courseInput.course_title)
          await logger.info(`📄 Generating English PDF only for course: ${courseIdForPdf}`)
          const pdfResult = await generateEnglishPdfOnly(courseIdForPdf)
          result = {
            courseId: courseIdForPdf,
            pdfEnPath: pdfResult.pdfEnPath,
            pdfArPath: undefined,
            warnings: ['English PDF only generated (skipped translation and Arabic PDF)'],
          }
        } else {
          // Generate complete course
          result = await generateCompleteCourse(courseInput)
        }

        successCount++
        console.log(`\n✅ Course ${courseIndex} generated successfully!`)
        console.log(`   Course ID: ${result.courseId}`)
        console.log(`   English PDF: ${result.pdfEnPath}`)
        if (result.pdfArPath) {
          console.log(`   Arabic PDF: ${result.pdfArPath}`)
        }
        if (result.warnings && result.warnings.length > 0) {
          console.log(`   ⚠️ Warnings: ${result.warnings.join('; ')}`)
        }

        await logger.info(`✅ Course ${courseIndex} completed: ${result.courseId}`)

        // Wait a bit before next course to avoid rate limits
        if (i < coursesToGenerate.length - 1) {
          console.log(`\n⏳ Waiting 5 seconds before next course...\n`)
          await new Promise(resolve => setTimeout(resolve, 5000))
        }

      } catch (error) {
        errorCount++
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`\n❌ Error generating course ${courseIndex}: ${errorMessage}`)
        await logger.error(`❌ Course ${courseIndex} failed: ${errorMessage}`, error)
        
        // Continue with next course even if one fails
        if (i < coursesToGenerate.length - 1) {
          console.log(`\n⏭️ Continuing with next course...\n`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`🎉 All courses processed!`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log(`${'='.repeat(60)}\n`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Fatal error: ${errorMessage}`)
    await logger.error('❌ Fatal error in batch generation:', error)
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })

