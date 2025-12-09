#!/usr/bin/env tsx

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { config } from '@/lib/config'
import { encodeSupabasePath } from '@/lib/supabase/storage'

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

    if (course.pdf_path !== expectedPdfPath) {
      data.pdf_path = expectedPdfPath
    }

    if (course.cover_image !== expectedCoverPath) {
      data.cover_image = expectedCoverPath
    }

    if (Object.keys(data).length > 0) {
      await prisma.course.update({
        where: { id: course.id },
        data,
      })
      updated += 1
      console.log(`Updated asset paths for course: ${course.slug}`)
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

