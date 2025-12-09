// lib/pdf/index.ts - Main entry point for PDF course generation

import { CourseGenerationInput, CourseGenerationResult, GeneratedCourse } from './types'
import { generateCourseEn, translateCourseToArabic } from './generator'
import { generateCoverImage, generateDiagramImages } from './images'
import { generateCoursePdf } from './pdf-generator'
import { logger } from './logger'
import { updateStatus, clearStatus, loadStatus } from './status-tracker'
import fs from 'fs/promises'
import path from 'path'
import { config } from '@/lib/config'

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const memoryCourses = new Map<string, GeneratedCourse>()

function getMemoryKey(courseId: string, language: 'EN' | 'AR') {
  return `${courseId}-${language}`
}

/**
 * Save intermediate course JSON to temp directory
 */
async function saveIntermediateCourse(course: any, courseId: string, language: 'EN' | 'AR'): Promise<string> {
  if (isServerless) {
    const key = getMemoryKey(courseId, language)
    memoryCourses.set(key, course)
    return `memory://${key}`
  }
  const tempDir = path.join(process.cwd(), 'public', 'courses', 'temp')
  await fs.mkdir(tempDir, { recursive: true })
  const filePath = path.join(tempDir, `${courseId}-${language.toLowerCase()}.json`)
  await fs.writeFile(filePath, JSON.stringify(course, null, 2))
  return filePath
}

/**
 * Load intermediate course JSON from temp directory
 */
async function loadIntermediateCourse(courseId: string, language: 'EN' | 'AR'): Promise<GeneratedCourse | null> {
  if (isServerless) {
    const key = getMemoryKey(courseId, language)
    return memoryCourses.get(key) ?? null
  }
  try {
    const filePath = path.join(process.cwd(), 'public', 'courses', 'temp', `${courseId}-${language.toLowerCase()}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as GeneratedCourse
  } catch (error) {
    return null
  }
}

/**
 * Generate complete course (EN + AR versions) with PDFs and images
 */
export async function generateCompleteCourse(input: CourseGenerationInput): Promise<CourseGenerationResult> {
  const startedAt = new Date().toISOString()
  
  try {
    // Don't clear status if we're resuming - let resumeCourseGeneration handle it
    // Only clear if starting fresh generation
    const existingStatus = await loadStatus()
    if (!existingStatus || existingStatus.stage === 'completed' || existingStatus.stage === 'error') {
      await clearStatus()
    }
    
    // Step 1: Generate English course
    await updateStatus({
      stage: 'generating_en',
      progress: 10,
      message: 'Generating English course content...',
      startedAt,
    })
    await logger.info('📝 Generating English course...')
    await logger.info(`Using model: ${config.openai.models.course} (max tokens: ${config.openai.settings.course.maxTokens})`)
    const courseEn = await generateCourseEn(input)
    const courseId = courseEn.meta.course_id
    await logger.info(`✅ English course generated (ID: ${courseId})`)
    
    // Save intermediate result
    const courseEnPath = await saveIntermediateCourse(courseEn, courseId, 'EN')
    await updateStatus({
      courseId,
      stage: 'generating_cover',
      progress: 30,
      message: 'English course generated. Generating cover image...',
      intermediateFiles: { courseEnJson: courseEnPath },
    })

    // Step 2: Generate cover image (once, will be used for both languages)
    await logger.info('🎨 Generating cover image...')
    const { publicPath: coverImagePublicPath, localPath: coverImageLocalPath } = await generateCoverImage(courseEn, courseId)
    await logger.info(`✅ Cover image saved: ${coverImagePublicPath}`)
    await updateStatus({
      progress: 40,
      message: 'Cover image generated. Generating diagrams...',
      intermediateFiles: { courseEnJson: courseEnPath, coverImage: coverImagePublicPath },
    })

    // Step 3: Generate diagram images
    await logger.info('📊 Generating diagram images...')
    const diagramImagePaths = await generateDiagramImages(courseEn, courseId)
    await logger.info(`✅ Generated ${Object.keys(diagramImagePaths).length} diagram(s)`)
    await updateStatus({
      progress: 50,
      message: 'Diagrams generated. Translating to Arabic...',
      intermediateFiles: {
        courseEnJson: courseEnPath,
        coverImage: coverImagePublicPath,
        diagrams: Object.fromEntries(Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])),
      },
    })

    // Step 4: Translate to Arabic (with error handling)
    let courseAr: GeneratedCourse | undefined
    let courseArPath: string | undefined
    const warnings: string[] = []
    
    try {
      await logger.info('🌐 Translating course to Arabic...')
      courseAr = await translateCourseToArabic(courseEn)
      await logger.info('✅ Arabic translation completed')
      
      // Save intermediate result
      courseArPath = await saveIntermediateCourse(courseAr, courseId, 'AR')
      await updateStatus({
        progress: 70,
        stage: 'generating_pdf_en',
        message: 'Arabic translation completed. Generating English PDF...',
        intermediateFiles: {
          courseEnJson: courseEnPath,
          courseArJson: courseArPath,
          coverImage: coverImagePublicPath,
          diagrams: Object.fromEntries(Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])),
        },
      })
    } catch (translationError) {
      const errorMessage = translationError instanceof Error ? translationError.message : String(translationError)
      await logger.warn(`⚠️ Translation to Arabic failed: ${errorMessage}. Continuing with English PDF generation...`)
      warnings.push(`Arabic translation failed: ${errorMessage}. English PDF will be generated, but Arabic PDF will be skipped.`)
      
      await updateStatus({
        progress: 60,
        stage: 'generating_pdf_en',
        message: 'Translation failed. Generating English PDF...',
        warnings,
        intermediateFiles: {
          courseEnJson: courseEnPath,
          coverImage: coverImagePublicPath,
          diagrams: Object.fromEntries(Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])),
        },
      })
    }

    // Step 5: Generate English PDF (always generate, even if translation failed)
    await logger.info('📄 Generating English PDF...')
    const coverImagePathForPdf = coverImageLocalPath ?? coverImagePublicPath
    const pdfEn = await generateCoursePdf(courseEn, coverImagePathForPdf, diagramImagePaths, courseId, 'EN')
    await logger.info(`✅ English PDF saved: ${pdfEn.publicPath}`)
    
    // Step 6: Generate Arabic PDF (only if translation succeeded)
    let pdfAr: { publicPath: string; buffer: Buffer } | undefined
    
    if (courseAr) {
      await updateStatus({
        progress: 85,
        stage: 'generating_pdf_ar',
        message: 'English PDF generated. Generating Arabic PDF...',
        warnings,
      })
      
      await logger.info('📄 Generating Arabic PDF...')
      pdfAr = await generateCoursePdf(courseAr, coverImagePathForPdf, diagramImagePaths, courseId, 'AR')
      await logger.info(`✅ Arabic PDF saved: ${pdfAr.publicPath}`)
    } else {
      await logger.info('⏭️ Skipping Arabic PDF generation (translation not available)')
    }

    const result: CourseGenerationResult = {
      courseEn,
      ...(courseAr && { courseAr }),
      coverImagePath: coverImagePublicPath,
      diagramImagePaths: Object.fromEntries(
        Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])
      ),
      pdfEnPath: pdfEn.publicPath,
      ...(pdfAr && { pdfArPath: pdfAr.publicPath }),
      courseId,
      ...(warnings.length > 0 && { warnings }),
    }

    // Mark as completed
    await updateStatus({
      stage: 'completed',
      progress: 100,
      message: 'Course generation completed successfully!',
      completedAt: new Date().toISOString(),
    })
    await logger.info('✅ Course generation completed successfully!', { courseId })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await logger.error('❌ Error in course generation:', error)
    await updateStatus({
      stage: 'error',
      message: `Error: ${errorMessage}`,
      error: errorMessage,
    })
    throw error
  }
}

/**
 * Resume course generation from saved intermediate files
 */
export async function resumeCourseGeneration(courseId: string): Promise<CourseGenerationResult> {
  const startedAt = new Date().toISOString()
  
  try {
    await logger.info(`🔄 Resuming course generation for: ${courseId}`)
    
    // Load saved English course
    const courseEn = await loadIntermediateCourse(courseId, 'EN')
    if (!courseEn) {
      throw new Error(`No saved English course found for ${courseId}. Please start fresh generation.`)
    }
    
    await logger.info(`✅ Loaded saved English course`)
    await updateStatus({
      courseId,
      stage: 'generating_cover',
      progress: 30,
      message: 'Resumed from saved English course. Generating cover image...',
      startedAt,
    })

    // Step 2: Generate cover image (once, will be used for both languages)
    await logger.info('🎨 Generating cover image...')
    const { publicPath: coverImagePublicPath, localPath: coverImageLocalPath } = await generateCoverImage(courseEn, courseId)
    await logger.info(`✅ Cover image saved: ${coverImagePublicPath}`)
    await updateStatus({
      progress: 40,
      message: 'Cover image generated. Generating diagrams...',
      intermediateFiles: { courseEnJson: path.join('temp', `${courseId}-en.json`) },
    })

    // Step 3: Generate diagram images
    await logger.info('📊 Generating diagram images...')
    const diagramImagePaths = await generateDiagramImages(courseEn, courseId)
    await logger.info(`✅ Generated ${Object.keys(diagramImagePaths).length} diagram(s)`)
    await updateStatus({
      progress: 50,
      message: 'Diagrams generated. Translating to Arabic...',
      intermediateFiles: {
        courseEnJson: path.join('temp', `${courseId}-en.json`),
        coverImage: coverImagePublicPath,
        diagrams: Object.fromEntries(Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])),
      },
    })

    // Step 4: Translate to Arabic (with error handling)
    let courseAr: GeneratedCourse | undefined
    let courseArPath: string | undefined
    const warnings: string[] = []
    
    try {
      await logger.info('🌐 Translating course to Arabic...')
      courseAr = await translateCourseToArabic(courseEn)
      await logger.info('✅ Arabic translation completed')
      
      // Save intermediate result
      courseArPath = await saveIntermediateCourse(courseAr, courseId, 'AR')
      await updateStatus({
        progress: 70,
        stage: 'generating_pdf_en',
        message: 'Arabic translation completed. Generating English PDF...',
        intermediateFiles: {
          courseEnJson: path.join('temp', `${courseId}-en.json`),
          courseArJson: courseArPath,
          coverImage: coverImagePublicPath,
          diagrams: Object.fromEntries(Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])),
        },
      })
    } catch (translationError) {
      const errorMessage = translationError instanceof Error ? translationError.message : String(translationError)
      await logger.warn(`⚠️ Translation to Arabic failed: ${errorMessage}. Continuing with English PDF generation...`)
      warnings.push(`Arabic translation failed: ${errorMessage}. English PDF will be generated, but Arabic PDF will be skipped.`)
      
      await updateStatus({
        progress: 60,
        stage: 'generating_pdf_en',
        message: 'Translation failed. Generating English PDF...',
        warnings,
        intermediateFiles: {
          courseEnJson: path.join('temp', `${courseId}-en.json`),
          coverImage: coverImagePublicPath,
          diagrams: Object.fromEntries(Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])),
        },
      })
    }

    // Step 5: Generate English PDF (always generate, even if translation failed)
    await logger.info('📄 Generating English PDF...')
    const coverImagePathForPdf = coverImageLocalPath ?? coverImagePublicPath
    const pdfEn = await generateCoursePdf(courseEn, coverImagePathForPdf, diagramImagePaths, courseId, 'EN')
    await logger.info(`✅ English PDF saved: ${pdfEn.publicPath}`)
    
    // Step 6: Generate Arabic PDF (only if translation succeeded)
    let pdfAr: { publicPath: string; buffer: Buffer } | undefined
    
    if (courseAr) {
      await updateStatus({
        progress: 85,
        stage: 'generating_pdf_ar',
        message: 'English PDF generated. Generating Arabic PDF...',
        warnings,
      })
      
      await logger.info('📄 Generating Arabic PDF...')
      pdfAr = await generateCoursePdf(courseAr, coverImagePathForPdf, diagramImagePaths, courseId, 'AR')
      await logger.info(`✅ Arabic PDF saved: ${pdfAr.publicPath}`)
    } else {
      await logger.info('⏭️ Skipping Arabic PDF generation (translation not available)')
    }

    const result: CourseGenerationResult = {
      courseEn,
      ...(courseAr && { courseAr }),
      coverImagePath: coverImagePublicPath,
      diagramImagePaths: Object.fromEntries(
        Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])
      ),
      pdfEnPath: pdfEn.publicPath,
      ...(pdfAr && { pdfArPath: pdfAr.publicPath }),
      courseId,
      ...(warnings.length > 0 && { warnings }),
    }

    // Mark as completed
    await updateStatus({
      stage: 'completed',
      progress: 100,
      message: 'Course generation completed successfully!',
      completedAt: new Date().toISOString(),
    })
    await logger.info('✅ Course generation completed successfully!', { courseId })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await logger.error('❌ Error resuming course generation:', error)
    await updateStatus({
      stage: 'error',
      message: `Error: ${errorMessage}`,
      error: errorMessage,
    })
    throw error
  }
}

/**
 * Generate only English PDF from existing course data
 * Useful when translation fails or you only need English version
 */
export async function generateEnglishPdfOnly(courseId: string): Promise<{ pdfEnPath: string }> {
  try {
    await logger.info(`📄 Generating English PDF only for course: ${courseId}`)
    
    // Load saved English course
    const courseEn = await loadIntermediateCourse(courseId, 'EN')
    if (!courseEn) {
      throw new Error(`No saved English course found for ${courseId}`)
    }
    
    // Try to get image paths from status, or find them from file system
    const status = await loadStatus()
    let coverImageLocalPath: string
    let diagramImagePaths: Record<string, { publicPath: string; localPath: string }> = {}
    
    if (status?.intermediateFiles?.coverImage) {
      // Use paths from status
      coverImageLocalPath = status.intermediateFiles.coverImage.startsWith('/') 
        ? status.intermediateFiles.coverImage 
        : `/${status.intermediateFiles.coverImage}`
      
      if (status.intermediateFiles.diagrams) {
        for (const [diagramId, publicPath] of Object.entries(status.intermediateFiles.diagrams)) {
          const localPath = publicPath.startsWith('/') ? publicPath : `/${publicPath}`
          diagramImagePaths[diagramId] = {
            publicPath: publicPath as string,
            localPath,
          }
        }
      }
    } else {
      // Find images from file system
      await logger.info('Image paths not found in status. Searching file system...')
      
      // Check cover image
      const coverImagePath = `/images/courses/${courseId}-cover.png`
      const coverImageFullPath = path.join(process.cwd(), 'public', coverImagePath.replace(/^\//, ''))
      try {
        await fs.access(coverImageFullPath)
        coverImageLocalPath = coverImagePath
        await logger.info(`Found cover image: ${coverImageLocalPath}`)
      } catch {
        throw new Error(`Cover image not found: ${coverImageFullPath}`)
      }
      
      // Find diagram images
      const diagramsDir = path.join(process.cwd(), 'public', 'images', 'courses')
      try {
        const diagramFiles = await fs.readdir(diagramsDir)
        for (const file of diagramFiles) {
          if (file.startsWith(`${courseId}-diagram-`) && file.endsWith('.webp')) {
            const diagramId = file.replace(`${courseId}-`, '').replace('.webp', '')
            const publicPath = `/images/courses/${file}`
            diagramImagePaths[diagramId] = {
              publicPath,
              localPath: publicPath,
            }
          }
        }
        await logger.info(`Found ${Object.keys(diagramImagePaths).length} diagram(s)`)
      } catch (error) {
        await logger.warn(`Could not read diagrams directory: ${error}`)
        // Continue without diagrams if directory doesn't exist
      }
    }
    
    // Generate PDF
    await updateStatus({
      stage: 'generating_pdf_en',
      progress: 90,
      message: 'Generating English PDF...',
    })
    
    const pdfEn = await generateCoursePdf(courseEn, coverImageLocalPath, diagramImagePaths, courseId, 'EN')
    await logger.info(`✅ English PDF saved: ${pdfEn.publicPath}`)
    
    await updateStatus({
      stage: 'completed',
      progress: 100,
      message: 'English PDF generated successfully!',
      completedAt: new Date().toISOString(),
    })
    
    return { pdfEnPath: pdfEn.publicPath }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error, null, 2)
    await logger.error('❌ Error generating English PDF:', error)
    await logger.error('Error details:', errorDetails)
    console.error('❌ Error generating English PDF:', error)
    console.error('Error details:', errorDetails)
    await updateStatus({
      stage: 'error',
      message: `Error: ${errorMessage}`,
      error: errorMessage,
    })
    throw error
  }
}

/**
 * Generate only Arabic PDF from existing course data
 * Requires Arabic translation to be available (either saved or will be generated)
 */
export async function generateArabicPdfOnly(courseId: string): Promise<{ pdfArPath: string }> {
  try {
    await logger.info(`📄 Generating Arabic PDF only for course: ${courseId}`)
    
    // Try to load saved Arabic course first
    let courseAr = await loadIntermediateCourse(courseId, 'AR')
    
    if (!courseAr) {
      // If no saved Arabic course, load English and translate
      await logger.info('No saved Arabic course found. Loading English course and translating...')
      const courseEn = await loadIntermediateCourse(courseId, 'EN')
      if (!courseEn) {
        throw new Error(`No saved English course found for ${courseId}`)
      }
      
      await updateStatus({
        stage: 'translating_ar',
        progress: 50,
        message: 'Translating course to Arabic...',
      })
      
      courseAr = await translateCourseToArabic(courseEn)
      await saveIntermediateCourse(courseAr, courseId, 'AR')
      await logger.info('✅ Arabic translation completed')
    }
    
    // Try to get image paths from status, or find them from file system
    const status = await loadStatus()
    let coverImageLocalPath: string
    let diagramImagePaths: Record<string, { publicPath: string; localPath: string }> = {}
    
    if (status?.intermediateFiles?.coverImage) {
      // Use paths from status
      coverImageLocalPath = status.intermediateFiles.coverImage.startsWith('/') 
        ? status.intermediateFiles.coverImage 
        : `/${status.intermediateFiles.coverImage}`
      
      if (status.intermediateFiles.diagrams) {
        for (const [diagramId, publicPath] of Object.entries(status.intermediateFiles.diagrams)) {
          const localPath = publicPath.startsWith('/') ? publicPath : `/${publicPath}`
          diagramImagePaths[diagramId] = {
            publicPath: publicPath as string,
            localPath,
          }
        }
      }
    } else {
      // Find images from file system
      await logger.info('Image paths not found in status. Searching file system...')
      
      // Check cover image
      const coverImagePath = `/images/courses/${courseId}-cover.png`
      const coverImageFullPath = path.join(process.cwd(), 'public', coverImagePath.replace(/^\//, ''))
      try {
        await fs.access(coverImageFullPath)
        coverImageLocalPath = coverImagePath
        await logger.info(`Found cover image: ${coverImageLocalPath}`)
      } catch {
        throw new Error(`Cover image not found: ${coverImageFullPath}`)
      }
      
      // Find diagram images
      const diagramsDir = path.join(process.cwd(), 'public', 'images', 'courses')
      try {
        const diagramFiles = await fs.readdir(diagramsDir)
        for (const file of diagramFiles) {
          if (file.startsWith(`${courseId}-diagram-`) && file.endsWith('.webp')) {
            const diagramId = file.replace(`${courseId}-`, '').replace('.webp', '')
            const publicPath = `/images/courses/${file}`
            diagramImagePaths[diagramId] = {
              publicPath,
              localPath: publicPath,
            }
          }
        }
        await logger.info(`Found ${Object.keys(diagramImagePaths).length} diagram(s)`)
      } catch (error) {
        await logger.warn(`Could not read diagrams directory: ${error}`)
        // Continue without diagrams if directory doesn't exist
      }
    }
    
    // Generate PDF
    await updateStatus({
      stage: 'generating_pdf_ar',
      progress: 90,
      message: 'Generating Arabic PDF...',
    })
    
    const pdfAr = await generateCoursePdf(courseAr, coverImageLocalPath, diagramImagePaths, courseId, 'AR')
    await logger.info(`✅ Arabic PDF saved: ${pdfAr.publicPath}`)
    
    await updateStatus({
      stage: 'completed',
      progress: 100,
      message: 'Arabic PDF generated successfully!',
      completedAt: new Date().toISOString(),
    })
    
    return { pdfArPath: pdfAr.publicPath }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await logger.error('❌ Error generating Arabic PDF:', error)
    await updateStatus({
      stage: 'error',
      message: `Error: ${errorMessage}`,
      error: errorMessage,
    })
    throw error
  }
}

// Re-export types and functions
export * from './types'
export * from './generator'
export * from './images'
export * from './pdf-generator'
export * from './templates'

