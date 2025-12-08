// lib/pdf/custom-course.ts - Complete Custom Course generation with PDF

import { generateCustomCourse } from '@/lib/openai/generate'
import { GeneratedCourse } from './types'
import { generateCoverImage, generateDiagramImages } from './images'
import { generateCoursePdf } from './pdf-generator'
import { translateCourseToArabic } from './generator'
import { CUSTOM_COURSE_JSON_SCHEMA } from './schema'
import { logger } from './logger'

/**
 * Generate complete Custom Course with PDFs and images
 */
export async function generateCustomCourseComplete(params: {
  experienceYears: string
  depositBudget: string
  riskTolerance: string
  markets: string[]
  tradingStyle: string
  timeCommitment?: string
  goalsFreeText: string
  additionalNotes?: string
  languages: string[] // Array of 'en' and/or 'ar'
}): Promise<{
  courseEn: GeneratedCourse
  courseAr?: GeneratedCourse
  coverImagePath: string
  diagramImagePaths: Record<string, string>
  pdfEnPath?: string
  pdfEnBuffer?: Buffer
  pdfArPath?: string
  pdfArBuffer?: Buffer
  courseId: string
  warnings?: string[]
}> {
  try {
    await logger.info('📝 Starting Custom Course generation...')

    // Step 1: Generate English course
    await logger.info('📝 Generating Custom Course content...')
    const { course: courseEn, tokens, model } = await generateCustomCourse({
      experienceYears: params.experienceYears,
      depositBudget: params.depositBudget,
      riskTolerance: params.riskTolerance,
      markets: params.markets,
      tradingStyle: params.tradingStyle,
      timeCommitment: params.timeCommitment,
      goalsFreeText: params.goalsFreeText,
      additionalNotes: params.additionalNotes,
      languages: params.languages,
    })

    const courseId = courseEn.meta.course_id
    await logger.info(`✅ Custom Course generated (ID: ${courseId}, tokens: ${tokens.total}, model: ${model})`)

    // Step 2: Generate cover image
    await logger.info('🎨 Generating cover image...')
    const { publicPath: coverImagePublicPath } = await generateCoverImage(courseEn, courseId)
    await logger.info(`✅ Cover image saved: ${coverImagePublicPath}`)

    // Step 3: Generate diagram images
    await logger.info('📊 Generating diagram images...')
    const diagramImagePaths = await generateDiagramImages(courseEn, courseId)
    await logger.info(`✅ Generated ${Object.keys(diagramImagePaths).length} diagram(s)`)

    // Step 4: Translate to Arabic (if 'ar' in languages)
    let courseAr: GeneratedCourse | undefined
    const warnings: string[] = []
    const needsArabic = params.languages.includes('ar')

    if (needsArabic) {
      try {
        await logger.info('🌐 Translating course to Arabic...')
        courseAr = await translateCourseToArabic(courseEn, CUSTOM_COURSE_JSON_SCHEMA)
        await logger.info('✅ Arabic translation completed')
      } catch (error) {
        // Extract error message properly - check for message property in object first
        let errorMessage: string
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = (error as any).message || String(error)
        } else {
          errorMessage = String(error)
        }
        await logger.warn(`⚠️ Arabic translation failed: ${errorMessage}`)
        warnings.push(`Arabic translation failed: ${errorMessage}`)
        // Continue without Arabic translation
      }
    }

    // Step 5: Generate PDFs for selected languages
    let pdfEnPath: string | undefined
    let pdfEnBuffer: Buffer | undefined
    let pdfArPath: string | undefined
    let pdfArBuffer: Buffer | undefined

    if (params.languages.includes('en')) {
      await logger.info('📄 Generating English PDF...')
      const pdfEn = await generateCoursePdf(courseEn, coverImagePublicPath, diagramImagePaths, courseId, 'EN')
      pdfEnPath = pdfEn.publicPath
      pdfEnBuffer = pdfEn.buffer
      await logger.info(`✅ English PDF saved: ${pdfEnPath}`)
    }

    if (needsArabic && courseAr) {
      await logger.info('📄 Generating Arabic PDF...')
      const pdfAr = await generateCoursePdf(courseAr, coverImagePublicPath, diagramImagePaths, courseId, 'AR')
      pdfArPath = pdfAr.publicPath
      pdfArBuffer = pdfAr.buffer
      await logger.info(`✅ Arabic PDF saved: ${pdfArPath}`)
    } else if (needsArabic && !courseAr) {
      warnings.push('Arabic PDF not generated due to translation failure')
    }

    await logger.info('✅ Custom Course generation completed successfully!', { courseId })

    return {
      courseEn,
      ...(courseAr && { courseAr }),
      coverImagePath: coverImagePublicPath,
      diagramImagePaths: Object.fromEntries(
        Object.entries(diagramImagePaths).map(([id, paths]) => [id, paths.publicPath])
      ),
      ...(pdfEnPath && { pdfEnPath }),
      ...(pdfEnBuffer && { pdfEnBuffer }),
      ...(pdfArPath && { pdfArPath }),
      ...(pdfArBuffer && { pdfArBuffer }),
      courseId,
      ...(warnings.length > 0 && { warnings }),
    }
  } catch (error) {
    // Log the incoming error first for debugging
    // Extract error message properly - check for message property in object first
    let errorMessageForLog: string
    if (error instanceof Error) {
      errorMessageForLog = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessageForLog = (error as any).message || String(error)
    } else {
      errorMessageForLog = String(error)
    }

    await logger.error('[Custom Course Complete] Caught error in generateCustomCourseComplete:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorName: error instanceof Error ? error.name : undefined,
      errorMessage: errorMessageForLog,
      hasCode: error && typeof error === 'object' && 'code' in error,
      errorCode: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined,
      hasDetails: error && typeof error === 'object' && 'details' in error,
      errorDetails: error && typeof error === 'object' && 'details' in error ? (error as any).details : undefined,
      errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
      fullError: error,
    })

    // Extract error message properly - check for message property in object first
    let errorMessage: string
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as any).message || String(error)
    } else {
      errorMessage = String(error)
    }
    
    const errorCode = (error && typeof error === 'object' && 'code' in error) 
      ? (error as { code: string }).code 
      : 'UNKNOWN'
    const errorDetails = (error && typeof error === 'object' && 'details' in error)
      ? (error as { details: any }).details
      : {}
    
    await logger.error('❌ Error in Custom Course generation:', {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      error,
    })
    
    // Re-throw the error to preserve its structure
    throw error
  }
}

