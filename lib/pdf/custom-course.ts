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
  courseRequestId?: number // For logging
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
    const courseRequestId = params.courseRequestId || 0
    
    logger.startTiming('custom-course-generation')
    await logger.info('📝 Starting Custom Course generation...', {
      courseRequestId,
      runId: courseRequestId,
      runType: 'custom-course',
      languages: params.languages,
      markets: params.markets,
      tradingStyle: params.tradingStyle,
      goalsLength: params.goalsFreeText.length,
    })

    // Step 1: Generate English course
    logger.startTiming('openai-generation')
    await logger.info('📝 Step 1/5: Generating Custom Course content via OpenAI...')
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
    await logger.endTiming('openai-generation', '✅ Step 1/5: Custom Course content generated')

    const courseId = courseEn.meta.course_id
    await logger.info(`📊 Generation stats:`, {
      courseId,
      tokens: { prompt: tokens.prompt, completion: tokens.completion, total: tokens.total },
      model,
      modules: courseEn.modules?.length || 0,
      lessons: courseEn.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0,
    })

    // Step 2: Generate cover image
    logger.startTiming('cover-image')
    await logger.info('🎨 Step 2/5: Generating cover image...')
    const { publicPath: coverImagePublicPath } = await generateCoverImage(courseEn, courseId)
    await logger.endTiming('cover-image', `✅ Step 2/5: Cover image saved`)
    await logger.info(`📸 Cover image path: ${coverImagePublicPath}`)

    // Step 3: Generate diagram images
    logger.startTiming('diagrams')
    await logger.info('📊 Step 3/5: Generating diagram images...', {
      diagramCount: courseEn.diagrams?.length || 0,
    })
    const diagramImagePaths = await generateDiagramImages(courseEn, courseId)
    await logger.endTiming('diagrams', `✅ Step 3/5: Generated ${Object.keys(diagramImagePaths).length} diagram(s)`)
    await logger.info(`📊 Diagram paths:`, Object.keys(diagramImagePaths))

    // Step 4: Translate to Arabic (if 'ar' in languages)
    let courseAr: GeneratedCourse | undefined
    const warnings: string[] = []
    const needsArabic = params.languages.includes('ar')

    if (needsArabic) {
      logger.startTiming('arabic-translation')
      try {
        await logger.info('🌐 Step 4/5: Translating course to Arabic...')
        courseAr = await translateCourseToArabic(courseEn, CUSTOM_COURSE_JSON_SCHEMA)
        await logger.endTiming('arabic-translation', '✅ Step 4/5: Arabic translation completed')
      } catch (error) {
        await logger.endTiming('arabic-translation')
        // Extract error message properly - check for message property in object first
        let errorMessage: string
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = (error as any).message || String(error)
        } else {
          errorMessage = String(error)
        }
        await logger.warn(`⚠️ Arabic translation failed: ${errorMessage}`, { error })
        warnings.push(`Arabic translation failed: ${errorMessage}`)
        // Continue without Arabic translation
      }
    } else {
      await logger.info('⏭️ Step 4/5: Skipping Arabic translation (not requested)')
    }

    // Step 5: Generate PDFs for selected languages
    let pdfEnPath: string | undefined
    let pdfEnBuffer: Buffer | undefined
    let pdfArPath: string | undefined
    let pdfArBuffer: Buffer | undefined

    if (params.languages.includes('en')) {
      logger.startTiming('pdf-en')
      await logger.info('📄 Step 5/5: Generating English PDF...')
      const pdfEn = await generateCoursePdf(courseEn, coverImagePublicPath, diagramImagePaths, courseId, 'EN', 'custom')
      pdfEnPath = pdfEn.publicPath
      pdfEnBuffer = pdfEn.buffer
      await logger.endTiming('pdf-en', `✅ Step 5/5: English PDF saved`)
      await logger.info(`📄 English PDF: ${pdfEnPath} (${(pdfEnBuffer.length / 1024).toFixed(2)} KB)`)
    }

    if (needsArabic && courseAr) {
      logger.startTiming('pdf-ar')
      await logger.info('📄 Generating Arabic PDF...')
      const pdfAr = await generateCoursePdf(courseAr, coverImagePublicPath, diagramImagePaths, courseId, 'AR', 'custom')
      pdfArPath = pdfAr.publicPath
      pdfArBuffer = pdfAr.buffer
      await logger.endTiming('pdf-ar', `✅ Arabic PDF saved`)
      await logger.info(`📄 Arabic PDF: ${pdfArPath} (${(pdfArBuffer.length / 1024).toFixed(2)} KB)`)
    } else if (needsArabic && !courseAr) {
      warnings.push('Arabic PDF not generated due to translation failure')
    }

    const totalDuration = await logger.endTiming('custom-course-generation', '✅ Custom Course generation completed successfully!')
    await logger.info('🎉 Generation summary:', {
      courseId,
      totalDuration: `${totalDuration}ms`,
      pdfs: {
        en: pdfEnPath ? 'generated' : 'skipped',
        ar: pdfArPath ? 'generated' : needsArabic ? 'failed' : 'skipped',
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    })

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

