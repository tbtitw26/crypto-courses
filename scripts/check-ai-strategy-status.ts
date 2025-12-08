// scripts/check-ai-strategy-status.ts - Check AI strategy generation status

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

import { loadAiStrategyStatus } from '../lib/pdf/ai-strategy-status-tracker'

async function displayStatus(idArg?: string) {
  if (!idArg) {
    console.error('Please provide strategyRunId: npm run ai-strategy:status -- <id>')
    return
  }
  const strategyRunId = parseInt(idArg, 10)
  if (Number.isNaN(strategyRunId)) {
    console.error('Invalid strategyRunId provided.')
    return
  }
  const status = await loadAiStrategyStatus(strategyRunId)

  if (!status) {
    console.log(`\n📊 No AI strategy generation found for ID ${strategyRunId}.\n`)
    return
  }

  console.log('\n🤖 AI Strategy Generation Status:')
  console.log(`  Strategy Run ID: ${status.strategyRunId}`)
  console.log(`  Course ID: ${status.courseId ?? 'N/A'}`)
  console.log(`  Stage: ${status.stage}`)
  console.log(`  Progress: ${status.progress}%`)
  console.log(`  Message: ${status.message}`)

  if (status.error) {
    console.log(`  ❌ Error: ${status.error}`)
  }

  if (status.warnings?.length) {
    console.log('  ⚠️  Warnings:')
    status.warnings.forEach((warning) => console.log(`     - ${warning}`))
  }

  if (status.startedAt) {
    console.log(`  Started: ${new Date(status.startedAt).toLocaleString()}`)
  }

  if (status.completedAt) {
    console.log(`  Completed: ${new Date(status.completedAt).toLocaleString()}`)
  }

  if (status.intermediateFiles) {
    console.log('  Intermediate Files:')
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
      console.log(
        `    - Diagrams: ${Object.keys(status.intermediateFiles.diagrams).length} diagram(s)`
      )
    }
  }

  console.log('')
}

displayStatus(process.argv[2]).catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

