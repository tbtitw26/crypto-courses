// scripts/add-all-courses.ts - Script to add all courses from temp folder to database

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { calculateCoursePriceEur, calculateTokensFromEur } from '../lib/course-pricing'
import { convertAmount } from '../lib/currency-utils'

const prisma = new PrismaClient()

// List of General courses (level = "General", market = "General")
const GENERAL_COURSES = [
  'trading-foundations-how-markets-really-work',
  'risk-first-capital-protection-for-beginners',
  'trading-psychology-101-discipline-over-dopamine',
  'journaling-review-system-learn-from-your-decisions',
  'building-a-personal-trading-plan-education-only',
  'position-sizing-r-multiples-plain-language',
]

/**
 * Extract course slug from filename
 * Example: "trading-foundations-how-markets-really-work-en.json" -> "trading-foundations-how-markets-really-work"
 */
function extractSlugFromFilename(filename: string): string | null {
  const match = filename.match(/^(.+)-(en|ar)\.json$/)
  return match ? match[1] : null
}

/**
 * Get all unique course slugs from temp folder
 */
async function getAllCourseSlugs(): Promise<string[]> {
  const tempDir = path.join(process.cwd(), 'public', 'courses', 'temp')
  const files = await fs.readdir(tempDir)
  
  const slugs = new Set<string>()
  
  for (const file of files) {
    if (file.endsWith('-en.json')) {
      const slug = extractSlugFromFilename(file)
      if (slug) {
        slugs.add(slug)
      }
    }
  }
  
  return Array.from(slugs).sort()
}

/**
 * Get existing course slugs from database
 */
async function getExistingCourseSlugs(): Promise<string[]> {
  const courses = await prisma.course.findMany({
    select: { slug: true },
  })
  return courses.map((c) => c.slug)
}

/**
 * Add a single course to database
 */
async function addCourseToDb(slug: string) {
  try {
    console.log(`\n📚 Processing course: ${slug}`)

    // Load JSON files
    const courseEnPath = path.join(
      process.cwd(),
      'public',
      'courses',
      'temp',
      `${slug}-en.json`
    )
    const courseArPath = path.join(
      process.cwd(),
      'public',
      'courses',
      'temp',
      `${slug}-ar.json`
    )

    // Check if files exist
    try {
      await fs.access(courseEnPath)
      await fs.access(courseArPath)
    } catch {
      console.warn(`⚠️  Skipping ${slug}: missing JSON files`)
      return
    }

    const courseEn = JSON.parse(await fs.readFile(courseEnPath, 'utf-8'))
    const courseAr = JSON.parse(await fs.readFile(courseArPath, 'utf-8'))

    // Extract data from English JSON
    const extractedSlug = courseEn.meta.course_id
    const title = courseEn.cover.title
    const titleAr = courseAr.cover.title
    const description = courseEn.cover.subtitle || courseEn.cover.title
    const descriptionAr = courseAr.cover.subtitle || courseAr.cover.title
    
    // Determine level and market
    // If course is in GENERAL_COURSES list, set level and market to "General"
    // Otherwise, use values from JSON
    const isGeneralCourse = GENERAL_COURSES.includes(extractedSlug)
    const level = isGeneralCourse ? 'General' : courseEn.meta.content_scope.level // "Beginner", "Intermediate", "Advanced", or "General"
    const market = isGeneralCourse ? 'General' : courseEn.meta.content_scope.market_scope[0] // "Forex", "Crypto", "Binary", or "General"

    // Transform modules from JSON to DB format
    const modules = courseEn.modules.map((m: any, idx: number) => ({
      order: idx + 1,
      title: m.title,
      summary: m.goal || m.title,
    }))

    // Calculate duration (approximately 1-1.5 hours per module)
    const moduleCount = modules.length
    const durationHoursMin = moduleCount // 1 hour per module
    const durationHoursMax = Math.ceil(moduleCount * 1.5) // 1.5 hours per module

    // Calculate price using new pricing logic
    const priceEur = calculateCoursePriceEur(
      level as 'General' | 'Beginner' | 'Intermediate' | 'Advanced',
      moduleCount,
      durationHoursMax,
      extractedSlug
    )
    const tokens = calculateTokensFromEur(priceEur)
    const priceGbp = convertAmount(priceEur, 'EUR', 'GBP')

    // PDF paths
    const pdfPath = `/courses/${slug}-en.pdf`
    const coverImage = `/images/courses/${slug}-cover.png`

    // Add course to database (only create, don't update existing)
    const result = await prisma.course.create({
      data: {
        slug: extractedSlug,
        title,
        title_ar: titleAr,
        description,
        description_ar: descriptionAr,
        level,
        market,
        price_gbp: Math.round(priceGbp * 100) / 100,
        tokens,
        pdf_path: pdfPath,
        cover_image: coverImage,
        featured: false, // Default to false, can be updated manually if needed
        modules: modules as any,
        duration_hours_min: durationHoursMin,
        duration_hours_max: durationHoursMax,
      },
    })

    console.log(`✅ Successfully added course: ${result.title}`)
    console.log(`   Slug: ${result.slug}`)
    console.log(`   Level: ${level}, Market: ${market}`)
    console.log(`   Modules: ${modules.length}`)
    console.log(`   Duration: ${durationHoursMin}-${durationHoursMax} hours`)
    console.log(`   Price: €${priceEur} (£${Math.round(priceGbp * 100) / 100} GBP) - ${tokens} tokens`)
    console.log(`   PDF: ${pdfPath}`)
    console.log(`   Cover: ${coverImage}`)
  } catch (error: any) {
    // If course already exists, skip it
    if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
      console.log(`⏭️  Course ${slug} already exists, skipping...`)
      return
    }
    console.error(`❌ Error adding course ${slug} to database:`, error)
    throw error
  }
}

async function main() {
  console.log('🌱 Starting to add all courses from temp folder to database...\n')

  try {
    // Get all course slugs from temp folder
    const allSlugs = await getAllCourseSlugs()
    console.log(`📋 Found ${allSlugs.length} courses in temp folder`)

    // Get existing course slugs from database
    const existingSlugs = await getExistingCourseSlugs()
    console.log(`📊 Found ${existingSlugs.length} courses already in database`)

    // Filter out existing courses
    const newSlugs = allSlugs.filter((slug) => !existingSlugs.includes(slug))
    console.log(`🆕 Will add ${newSlugs.length} new courses\n`)

    if (newSlugs.length === 0) {
      console.log('✅ All courses are already in database!')
      return
    }

    // Add each new course
    let successCount = 0
    let skipCount = 0

    for (const courseSlug of newSlugs) {
      try {
        await addCourseToDb(courseSlug)
        successCount++
      } catch (error: any) {
        if (error?.code === 'P2002') {
          skipCount++
        } else {
          console.error(`❌ Failed to add ${courseSlug}:`, error)
        }
      }
    }

    console.log(`\n🎉 Processing complete!`)
    console.log(`   ✅ Successfully added: ${successCount} courses`)
    console.log(`   ⏭️  Skipped (already exist): ${skipCount} courses`)
    console.log(`   ❌ Failed: ${newSlugs.length - successCount - skipCount} courses`)
  } catch (error) {
    console.error('❌ Error processing courses:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

