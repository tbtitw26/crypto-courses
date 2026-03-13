// scripts/generate-pdf-only.ts - Generate English PDF only for a specific course

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env'), override: true })

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found')
  process.exit(1)
}

import { generateEnglishPdfOnly } from '../lib/pdf'
import { logger } from '../lib/pdf/logger'

/**
 * Generate course ID from title
 */
function generateCourseId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

async function main() {
  const courseTitle = process.argv[2]
  
  if (!courseTitle) {
    console.error('❌ Usage: npm run generate-pdf-only <course-title>')
    console.error('Example: npm run generate-pdf-only "System Robustness for Crypto"')
    process.exit(1)
  }

  const courseId = generateCourseId(courseTitle)
  
  try {
    console.log(`📄 Generating English PDF only for course: ${courseId}\n`)
    const result = await generateEnglishPdfOnly(courseId)
    console.log(`\n✅ English PDF generated: ${result.pdfEnPath}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${errorMessage}`)
    await logger.error('❌ Error generating PDF:', error)
    process.exit(1)
  }
}

main()

