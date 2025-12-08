// scripts/check-custom-course-status.ts - Check custom course generation status

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env and .env.local files from project root
config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

import { loadCustomCourseStatus } from '../lib/pdf/custom-course-status-tracker'

/**
 * Display current generation status
 */
async function displayStatus(idArg: string | undefined) {
  if (!idArg) {
    console.error('Please provide courseRequestId: npm run custom-course:status -- <id>')
    return
  }
  const courseRequestId = parseInt(idArg, 10)
  if (Number.isNaN(courseRequestId)) {
    console.error('Invalid courseRequestId provided.')
    return
  }
  const status = await loadCustomCourseStatus(courseRequestId)
  if (status) {
    console.log('\n📊 Custom Course Generation Status:')
    console.log(`  Course Request ID: ${status.courseRequestId}`)
    console.log(`  Course ID: ${status.courseId || 'N/A'}`)
    console.log(`  Stage: ${status.stage}`)
    console.log(`  Progress: ${status.progress}%`)
    console.log(`  Message: ${status.message}`)
    if (status.error) {
      console.log(`  ❌ Error: ${status.error}`)
    }
    if (status.warnings && status.warnings.length > 0) {
      console.log(`  ⚠️  Warnings:`)
      status.warnings.forEach((warning) => console.log(`     - ${warning}`))
    }
    if (status.startedAt) {
      const started = new Date(status.startedAt)
      console.log(`  Started: ${started.toLocaleString()}`)
    }
    if (status.completedAt) {
      const completed = new Date(status.completedAt)
      console.log(`  Completed: ${completed.toLocaleString()}`)
    }
    if (status.intermediateFiles) {
      console.log(`  Intermediate Files:`)
      if (status.intermediateFiles.courseEnJson) {
        console.log(`    - English course JSON: ${status.intermediateFiles.courseEnJson}`)
      }
      if (status.intermediateFiles.courseArJson) {
        console.log(`    - Arabic course JSON: ${status.intermediateFiles.courseArJson}`)
      }
      if (status.intermediateFiles.coverImage) {
        console.log(`    - Cover image: ${status.intermediateFiles.coverImage}`)
      }
      if (status.intermediateFiles.diagrams) {
        console.log(`    - Diagrams: ${Object.keys(status.intermediateFiles.diagrams).length} diagram(s)`)
      }
    }
  } else {
    console.log(`\n📊 No custom course generation found for ID ${courseRequestId}.\n`)
  }
}

async function main() {
  await displayStatus(process.argv[2])
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

