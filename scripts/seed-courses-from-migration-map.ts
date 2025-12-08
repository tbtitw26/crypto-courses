import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

type MigrationUpload = {
  type: string
  bucket: string
  key: string
  supabasePath: string
}

type MigrationMap = {
  uploads: MigrationUpload[]
}

const MAP_FILENAME = 'supabase-migration-map.1765199038119.json'

function slugFromPdfKey(key: string): string | null {
  // key examples: ready/<slug>-en.pdf or ready/<slug>-ar.pdf
  const base = key.replace(/^ready\//, '')
  const match = base.match(/^(.*)-(en|ar)\.pdf$/)
  return match ? match[1] : null
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

async function main() {
  const mapPath = path.join(process.cwd(), MAP_FILENAME)
  const json = await fs.readFile(mapPath, 'utf-8')
  const map = JSON.parse(json) as MigrationMap

  const pdfEntries = map.uploads.filter((u) => u.type === 'pdf' && u.key.startsWith('ready/'))
  const imageEntries = map.uploads.filter((u) => u.bucket === 'course-images')

  // Build cover map by slug (best-effort)
  const coverBySlug = new Map<string, string>()
  for (const img of imageEntries) {
    // Examples: course-images/courses/<slug>-cover.webp
    const file = img.key.split('/').pop() || ''
    const coverMatch = file.match(/^(.*?)-cover\.(png|jpg|jpeg|webp)$/)
    if (coverMatch) {
      coverBySlug.set(coverMatch[1], img.supabasePath)
    }
  }

  const courses = new Map<
    string,
    {
      slug: string
      title: string
      pdf_path: string
      cover_image?: string | null
    }
  >()

  for (const pdf of pdfEntries) {
    const slug = slugFromPdfKey(pdf.key)
    if (!slug) continue
    if (courses.has(slug)) continue

    courses.set(slug, {
      slug,
      title: titleFromSlug(slug),
      pdf_path: pdf.supabasePath,
      cover_image: coverBySlug.get(slug) || null,
    })
  }

  console.log(`Found ${courses.size} courses to upsert`)

  for (const course of courses.values()) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        pdf_path: course.pdf_path,
        cover_image: course.cover_image,
      },
      create: {
        slug: course.slug,
        title: course.title,
        description: `Course ${course.title}`,
        level: 'General',
        market: 'General',
        price_gbp: 0,
        tokens: 0,
        pdf_path: course.pdf_path,
        cover_image: course.cover_image,
        featured: false,
      },
    })
  }

  console.log('Done seeding courses from migration map')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

