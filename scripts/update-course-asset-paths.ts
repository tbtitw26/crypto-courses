#!/usr/bin/env tsx

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { config } from '@/lib/config'
import { encodeSupabasePath, isSupabasePath, decodeSupabasePath, normalizeImageKey } from '@/lib/supabase/storage'

const prisma = new PrismaClient()

async function main() {
  if (!config.supabase.useStorage) {
    console.log('Supabase storage is disabled; skipping asset path update.')
    return
  }

  const pdfBucket = config.supabase.buckets.coursePdf
  const imageBucket = config.supabase.buckets.courseImages

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      slug: true,
      pdf_path: true,
      cover_image: true,
    },
  })

  let updated = 0

  for (const course of courses) {
    const expectedPdfPath = encodeSupabasePath(pdfBucket, `ready/${course.slug}-en.pdf`)
    const expectedCoverPath = encodeSupabasePath(imageBucket, `covers/${course.slug}-cover.png`)

    const data: Record<string, string> = {}

    // Check PDF path
    if (course.pdf_path !== expectedPdfPath) {
      data.pdf_path = expectedPdfPath
      console.log(`  PDF: ${course.pdf_path} → ${expectedPdfPath}`)
    }

    // Check cover image path - normalize legacy paths
    let currentCoverPath = course.cover_image
    if (currentCoverPath && isSupabasePath(currentCoverPath)) {
      const { bucket, key } = decodeSupabasePath(currentCoverPath)
      const normalizedKey = normalizeImageKey(key)
      const normalizedPath = encodeSupabasePath(bucket, normalizedKey)
      
      if (normalizedPath !== expectedCoverPath) {
        data.cover_image = expectedCoverPath
        console.log(`  Cover: ${currentCoverPath} → ${expectedCoverPath}`)
      } else if (currentCoverPath !== expectedCoverPath) {
        // Path needs normalization but bucket/key are correct
        data.cover_image = expectedCoverPath
        console.log(`  Cover (normalized): ${currentCoverPath} → ${expectedCoverPath}`)
      }
    } else if (currentCoverPath !== expectedCoverPath) {
      data.cover_image = expectedCoverPath
      console.log(`  Cover: ${currentCoverPath} → ${expectedCoverPath}`)
    }

    if (Object.keys(data).length > 0) {
      await prisma.course.update({
        where: { id: course.id },
        data,
      })
      updated += 1
      console.log(`✓ Updated asset paths for course: ${course.slug}`)
    }
  }

  console.log(`Completed course asset path update. Courses updated: ${updated}/${courses.length}`)
}

main()
  .catch((error) => {
    console.error('Failed to update course asset paths:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

