// scripts/add-trading-foundations-course.ts - Script to add trading-foundations course to database

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting to add trading-foundations course to database...')

  try {
    // Load JSON files
    const courseEnPath = path.join(
      process.cwd(),
      'public',
      'courses',
      'temp',
      'trading-foundations-how-markets-really-work-en.json'
    )
    const courseArPath = path.join(
      process.cwd(),
      'public',
      'courses',
      'temp',
      'trading-foundations-how-markets-really-work-ar.json'
    )

    const courseEn = JSON.parse(await fs.readFile(courseEnPath, 'utf-8'))
    const courseAr = JSON.parse(await fs.readFile(courseArPath, 'utf-8'))

    // Extract data from English JSON
    const slug = courseEn.meta.course_id
    const title = courseEn.cover.title
    const titleAr = courseAr.cover.title
    const description = courseEn.cover.subtitle
    const descriptionAr = courseAr.cover.subtitle
    const level = courseEn.meta.content_scope.level // "Beginner"
    const market = courseEn.meta.content_scope.market_scope[0] // "Forex" (first market)

    // Standard pricing for Beginner course
    const priceGbp = 69
    const tokens = 7900 // 79 EUR = 7900 tokens (100 tokens = 1 EUR)

    // PDF paths
    const pdfPath = '/courses/trading-foundations-how-markets-really-work-en.pdf'
    const coverImage = '/images/courses/trading-foundations-how-markets-really-work-cover.png'

    // Transform modules from JSON to DB format
    const modules = courseEn.modules.map((m: any, idx: number) => ({
      order: idx + 1,
      title: m.title,
      summary: m.goal || m.title,
    }))

    // Calculate duration (8 modules, approximately 1-1.5 hours per module)
    const durationHoursMin = 8 // 8 modules × 1 hour
    const durationHoursMax = 12 // 8 modules × 1.5 hours

    // Add course to database
    const result = await prisma.course.upsert({
      where: { slug },
      update: {
        title,
        title_ar: titleAr,
        description,
        description_ar: descriptionAr,
        level,
        market,
        price_gbp: priceGbp,
        tokens,
        pdf_path: pdfPath,
        cover_image: coverImage,
        featured: true,
        modules: modules as any,
        duration_hours_min: durationHoursMin,
        duration_hours_max: durationHoursMax,
      },
      create: {
        slug,
        title,
        title_ar: titleAr,
        description,
        description_ar: descriptionAr,
        level,
        market,
        price_gbp: priceGbp,
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
    console.log(`   Modules: ${modules.length}`)
    console.log(`   Duration: ${durationHoursMin}-${durationHoursMax} hours`)
    console.log(`   Price: £${priceGbp} (${tokens} tokens)`)
    console.log(`   PDF: ${pdfPath}`)
    console.log(`   Cover: ${coverImage}`)
  } catch (error) {
    console.error('❌ Error adding course to database:', error)
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

