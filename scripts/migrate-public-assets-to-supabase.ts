#!/usr/bin/env tsx

import 'dotenv/config'
import path from 'path'
import fs from 'fs/promises'
import { config } from '@/lib/config'
import {
  uploadPrivateAsset,
  uploadPublicAsset,
  encodeSupabasePath,
} from '@/lib/supabase/storage'

type UploadRecord = {
  type: 'pdf' | 'image'
  source: string
  bucket: string
  key: string
  size: number
  supabasePath: string
  publicUrl?: string
}

type SkipRecord = {
  source: string
  reason: string
}

const PDF_EXTENSIONS = new Set(['.pdf'])
const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.svg', '.gif'])

const projectRoot = process.cwd()
const publicDir = path.join(projectRoot, 'public')
const coursesDir = path.join(publicDir, 'courses')
const imagesDir = path.join(publicDir, 'images')

async function listFiles(dir: string, baseDir: string): Promise<Array<{ relativePath: string; absolutePath: string; size: number }>> {
  let results: Array<{ relativePath: string; absolutePath: string; size: number }> = []

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const nested = await listFiles(absolute, baseDir)
        results = results.concat(nested)
      } else if (entry.isFile()) {
        const stats = await fs.stat(absolute)
        results.push({
          absolutePath: absolute,
          relativePath: path.relative(baseDir, absolute).replace(/\\/g, '/'),
          size: stats.size,
        })
      }
    }
  } catch (error) {
    throw new Error(`Failed to read directory ${dir}: ${(error as Error).message}`)
  }

  return results
}

async function migratePdfFiles(): Promise<{ uploads: UploadRecord[]; skipped: SkipRecord[] }> {
  const uploads: UploadRecord[] = []
  const skipped: SkipRecord[] = []

  const files = await listFiles(coursesDir, coursesDir)

  for (const file of files) {
    const ext = path.extname(file.relativePath).toLowerCase()

    if (!PDF_EXTENSIONS.has(ext)) {
      skipped.push({ source: `public/courses/${file.relativePath}`, reason: 'Not a PDF' })
      continue
    }

    if (file.relativePath.startsWith('temp/')) {
      skipped.push({ source: `public/courses/${file.relativePath}`, reason: 'Temp directory (JSON data)' })
      continue
    }

    if (file.relativePath.startsWith('.')) {
      skipped.push({ source: `public/courses/${file.relativePath}`, reason: 'Hidden file' })
      continue
    }

    const buffer = await fs.readFile(file.absolutePath)
    const filename = path.basename(file.relativePath)
    const key = `ready/${filename}`
    const bucket = config.supabase.buckets.coursePdf

    const { signedUrl } = await uploadPrivateAsset(bucket, key, buffer, {
      contentType: 'application/pdf',
    })

    uploads.push({
      type: 'pdf',
      source: `public/courses/${file.relativePath}`,
      bucket,
      key,
      size: file.size,
      supabasePath: encodeSupabasePath(bucket, key),
      publicUrl: signedUrl,
    })
  }

  return { uploads, skipped }
}

type ImageClassification =
  | { kind: 'cover'; key: string }
  | { kind: 'diagram'; key: string }
  | { kind: 'other'; key: string }

const toSlug = (value: string): string => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'general'
}

const stripSuffixes = (value: string): string =>
  value
    .replace(/[-_]?cover$/i, '')
    .replace(/[-_]?diagram[s]?[-_\d]*$/i, '')
    .replace(/[-_]?diagrams?$/i, '')
    .replace(/[-_]?d\d+$/i, '')
    .replace(/diagram\d*$/i, '')

const classifyImage = (relativePath: string): ImageClassification => {
  const filename = path.basename(relativePath)
  const ext = path.extname(filename)
  const nameWithoutExt = filename.slice(0, filename.length - ext.length)
  const normalized = nameWithoutExt.toLowerCase()
  const looksLikeCover = normalized.includes('cover')
  const looksLikeDiagram =
    normalized.includes('diagram') ||
    /[-_]?d\d+$/.test(normalized) ||
    /-diagram\d+/.test(normalized) ||
    /_diagram\d*/.test(normalized)

  if (looksLikeCover) {
    return { kind: 'cover', key: `covers/${filename}` }
  }

  if (looksLikeDiagram) {
    const slug = toSlug(stripSuffixes(nameWithoutExt))
    return { kind: 'diagram', key: `diagrams/${slug}/${filename}` }
  }

  return { kind: 'other', key: `misc/${filename}` }
}

async function migrateImageFiles(): Promise<{ uploads: UploadRecord[]; skipped: SkipRecord[] }> {
  const uploads: UploadRecord[] = []
  const skipped: SkipRecord[] = []

  const baseDir = path.join(imagesDir, 'courses')
  const files = await listFiles(baseDir, baseDir)

  for (const file of files) {
    const ext = path.extname(file.relativePath).toLowerCase()

    if (!IMAGE_EXTENSIONS.has(ext)) {
      skipped.push({ source: `public/images/courses/${file.relativePath}`, reason: 'Unsupported image format' })
      continue
    }

    const buffer = await fs.readFile(file.absolutePath)
    const classification = classifyImage(file.relativePath)
    const key = classification.key
    const bucket = config.supabase.buckets.courseImages
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.gif'
        ? 'image/gif'
        : 'image/webp'

    const { publicUrl } = await uploadPublicAsset(bucket, key, buffer, {
      contentType,
    })

    uploads.push({
      type: 'image',
      source: `public/images/courses/${file.relativePath}`,
      bucket,
      key,
      size: file.size,
      supabasePath: encodeSupabasePath(bucket, key),
      publicUrl,
    })
  }

  return { uploads, skipped }
}

async function main() {
  if (!config.supabase.useStorage) {
    throw new Error(
      'Supabase storage is not enabled. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set or USE_SUPABASE_STORAGE=true.'
    )
  }

  console.log('Starting migration of assets from /public to Supabase Storage...')

  const [pdfResult, imageResult] = await Promise.all([migratePdfFiles(), migrateImageFiles()])

  const summary = {
    generatedAt: new Date().toISOString(),
    pdfUploaded: pdfResult.uploads.length,
    imagesUploaded: imageResult.uploads.length,
    pdfSkipped: pdfResult.skipped.length,
    imagesSkipped: imageResult.skipped.length,
    uploads: [...pdfResult.uploads, ...imageResult.uploads],
    skipped: [...pdfResult.skipped, ...imageResult.skipped],
  }

  const outputPath = path.join(projectRoot, `supabase-migration-map.${Date.now()}.json`)
  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2))

  console.log(`Migration complete. Uploaded PDFs: ${pdfResult.uploads.length}, images: ${imageResult.uploads.length}.`)
  console.log(`Skipped PDFs: ${pdfResult.skipped.length}, images: ${imageResult.skipped.length}.`)
  console.log(`Detailed mapping saved to ${path.relative(projectRoot, outputPath)}`)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})

