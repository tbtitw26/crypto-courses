// scripts/generate-missing-arabic-pdfs.ts - Generate Arabic PDFs for courses that only have English versions

// Load environment variables FIRST, before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env and .env files from project root
config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env'), override: true })

// Verify API key is loaded before proceeding
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables')
  console.error('Please add OPENAI_API_KEY to your .env file')
  process.exit(1)
}

// Log that API key is loaded (for debugging)
console.log('✅ Environment variables loaded. API key length:', process.env.OPENAI_API_KEY?.length || 0)

// Import non-lib modules (these don't depend on environment variables)
import { readdir } from 'fs/promises'
import { join } from 'path'

// Note: We'll use dynamic imports for lib modules to ensure env vars are loaded first

/**
 * Get list of courses that have English PDF but no Arabic PDF
 */
async function getMissingArabicPdfs(): Promise<string[]> {
  const pdfDir = join(process.cwd(), 'public', 'courses')
  const pdfFiles = await readdir(pdfDir)
  
  const enPdfs = pdfFiles
    .filter(f => f.endsWith('-en.pdf'))
    .map(f => f.replace('-en.pdf', ''))
  
  const arPdfs = pdfFiles
    .filter(f => f.endsWith('-ar.pdf'))
    .map(f => f.replace('-ar.pdf', ''))
  
  const missingAr = enPdfs.filter(courseId => !arPdfs.includes(courseId))
  
  return missingAr
}

/**
 * Main function
 */
async function main() {
  try {
    // Dynamically import lib modules AFTER environment variables are loaded
    const { generateArabicPdfOnly } = await import('../lib/pdf')
    const { logger } = await import('../lib/pdf/logger')
    
    console.log('🔍 Checking for courses missing Arabic PDFs...\n')
    
    const missingCourses = await getMissingArabicPdfs()
    
    if (missingCourses.length === 0) {
      console.log('✅ All courses have Arabic PDFs!')
      return
    }
    
    console.log(`📋 Found ${missingCourses.length} courses without Arabic PDFs:\n`)
    missingCourses.forEach((courseId, index) => {
      console.log(`  ${index + 1}. ${courseId}`)
    })
    console.log()
    
    let successCount = 0
    let errorCount = 0
    
    // Generate Arabic PDFs sequentially
    for (let i = 0; i < missingCourses.length; i++) {
      const courseId = missingCourses[i]
      
      console.log(`\n[${i + 1}/${missingCourses.length}] Generating Arabic PDF for: ${courseId}`)
      console.log('─'.repeat(70))
      
      try {
        // Verify API key is still available before each generation
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY is not available. Please check your .env file.')
        }
        
        const result = await generateArabicPdfOnly(courseId)
        console.log(`✅ Arabic PDF generated: ${result.pdfArPath}`)
        successCount++
        
        // Wait a bit before next course to avoid rate limits
        if (i < missingCourses.length - 1) {
          console.log('\n⏳ Waiting 5 seconds before next course...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      } catch (error) {
        errorCount++
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ Error generating Arabic PDF for ${courseId}: ${errorMessage}`)
        
        // Import logger dynamically for error logging
        const { logger: errorLogger } = await import('../lib/pdf/logger')
        await errorLogger.error(`Failed to generate Arabic PDF for ${courseId}:`, error)
        
        // Continue with next course even if this one failed
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 GENERATION SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Successfully generated: ${successCount}/${missingCourses.length}`)
    console.log(`❌ Failed: ${errorCount}/${missingCourses.length}`)
    console.log('='.repeat(70) + '\n')
    
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : String(error))
    
    // Try to log error, but don't fail if logger import fails
    try {
      const { logger: errorLogger } = await import('../lib/pdf/logger')
      await errorLogger.error('Fatal error in generate-missing-arabic-pdfs:', error)
    } catch (loggerError) {
      // Ignore logger import errors
    }
    
    process.exit(1)
  }
}

main()

