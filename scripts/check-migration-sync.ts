#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'

type UploadEntry = {
  type: 'pdf' | 'image'
  source: string
}

type MigrationReport = {
  uploads: UploadEntry[]
}

const reportPath = process.argv[2] ?? 'supabase-migration-map.1765199038119.json'

if (!fs.existsSync(reportPath)) {
  console.error(`Report file not found: ${reportPath}`)
  process.exit(1)
}

const report: MigrationReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'))

const workspaceRoot = process.cwd().replace(/\\/g, '/')

const walkFiles = (dir: string, matcher: (absolutePath: string) => boolean, list: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(abs, matcher, list)
    } else if (entry.isFile() && matcher(abs)) {
      list.push(abs.replace(/\\/g, '/'))
    }
  }
  return list
}

const toWorkspaceRelative = (absolutePath: string) =>
  absolutePath.replace(/\\/g, '/').replace(`${workspaceRoot}/`, '')

const normalizeSource = (source: string) => source.replace(/\\/g, '/')

const pdfUploads = new Set(
  report.uploads.filter((entry) => entry.type === 'pdf').map((entry) => normalizeSource(entry.source))
)

const imgUploads = new Set(
  report.uploads.filter((entry) => entry.type === 'image').map((entry) => normalizeSource(entry.source))
)

const localPdfFiles = walkFiles(path.join(process.cwd(), 'public', 'courses'), (file) =>
  file.toLowerCase().endsWith('.pdf')
).map((file) => toWorkspaceRelative(file))

const localImageFiles = walkFiles(
  path.join(process.cwd(), 'public', 'images', 'courses'),
  () => true
).map((file) => toWorkspaceRelative(file))

const missingPdfUploads = localPdfFiles.filter(
  (file) => !pdfUploads.has(file)
)
const missingImageUploads = localImageFiles.filter(
  (file) => !imgUploads.has(file)
)

const summary = {
  pdfLocalCount: localPdfFiles.length,
  pdfUploadsCount: pdfUploads.size,
  missingPdfUploads: missingPdfUploads.length,
  imageLocalCount: localImageFiles.length,
  imageUploadsCount: imgUploads.size,
  missingImageUploads: missingImageUploads.length,
}

console.table(summary)

if (missingPdfUploads.length) {
  console.log('\nPDF files present locally but missing from report:')
  console.log(missingPdfUploads.join('\n'))
}

if (missingImageUploads.length) {
  console.log('\nImage files present locally but missing from report:')
  console.log(missingImageUploads.join('\n'))
}

