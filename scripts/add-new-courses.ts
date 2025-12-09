// scripts/add-new-courses.ts - Script to add new courses to database

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

// List of new courses to add
const courses = [
  'position-sizing-r-multiples-plain-language',
  'building-a-personal-trading-plan-education-only',
  'journaling-review-system-learn-from-your-decisions',
  'trading-psychology-101-discipline-over-dopamine',
  'risk-first-capital-protection-for-beginners',
]

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

    // Add course to database
    const result = await prisma.course.upsert({
      where: { slug: extractedSlug },
      update: {
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
        featured: true,
        modules: modules as any,
        duration_hours_min: durationHoursMin,
        duration_hours_max: durationHoursMax,
      },
      create: {
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
        featured: true,
        modules: modules as any,
        duration_hours_min: durationHoursMin,
        duration_hours_max: durationHoursMax,
      },
    })

    console.log(`✅ Successfully added/updated course: ${result.title}`)
    console.log(`   Slug: ${result.slug}`)
    console.log(`   Level: ${level}, Market: ${market}`)
    console.log(`   Modules: ${modules.length}`)
    console.log(`   Duration: ${durationHoursMin}-${durationHoursMax} hours`)
    console.log(`   Price: €${priceEur} (£${Math.round(priceGbp)} GBP) - ${tokens} tokens`)
    console.log(`   PDF: ${pdfPath}`)
    console.log(`   Cover: ${coverImage}`)
  } catch (error) {
    console.error(`❌ Error adding course ${slug} to database:`, error)
    throw error
  }
}

async function main() {
  console.log('🌱 Starting to add 5 new courses to database...')
  console.log(`📋 Courses to process: ${courses.length}`)

  try {
    for (const courseSlug of courses) {
      await addCourseToDb(courseSlug)
    }

    console.log(`\n🎉 Successfully processed all ${courses.length} courses!`)
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

