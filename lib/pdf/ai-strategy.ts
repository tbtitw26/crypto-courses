// lib/pdf/ai-strategy.ts - Complete AI Strategy generation with PDF

import { generateAIStrategy } from '@/lib/openai/generate'
import { GeneratedCourse } from './types'
import { generateCoverImage, generateDiagramImages } from './images'
import { generateCoursePdf } from './pdf-generator'
import { translateCourseToArabic } from './generator'
import { logger } from './logger'
import { AI_STRATEGY_JSON_SCHEMA } from './schema'

/**
 * Generate complete AI Strategy with PDFs and images
 */
export async function generateAIStrategyComplete(params: {
  experienceYears: string
  depositBudget: string
  riskTolerance: string
  markets: string[]
  tradingStyle: string
  timeCommitment?: string
  mainObjective: string
  market?: string
  timeframe?: string
  riskPerTrade?: string
  maxTrades?: string
  instruments?: string
  focus?: string
  detailLevel?: string
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
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  model?: string
}> {
  try {
    await logger.info('📝 Starting AI Strategy generation...')

    // Step 1: Generate English strategy
    await logger.info('📝 Generating AI Strategy content...')
    const { course: courseEn, tokens, model } = await generateAIStrategy({
      experienceYears: params.experienceYears,
      depositBudget: params.depositBudget,
      riskTolerance: params.riskTolerance,
      markets: params.markets,
      tradingStyle: params.tradingStyle,
      timeCommitment: params.timeCommitment,
      mainObjective: params.mainObjective,
      market: params.market,
      timeframe: params.timeframe,
      riskPerTrade: params.riskPerTrade,
      maxTrades: params.maxTrades,
      instruments: params.instruments,
      focus: params.focus,
      detailLevel: params.detailLevel,
      language: 'en',
    })

    const courseId = courseEn.meta.course_id
    await logger.info(`✅ AI Strategy generated (ID: ${courseId}, tokens: ${tokens.total}, model: ${model})`)

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
        await logger.info('🌐 Translating strategy to Arabic...')
        courseAr = await translateCourseToArabic(courseEn, AI_STRATEGY_JSON_SCHEMA)
        await logger.info('✅ Arabic translation completed')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
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

    await logger.info('✅ AI Strategy generation completed successfully!', { courseId })

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
      tokens,
      model,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await logger.error('❌ Error in AI Strategy generation:', error)
    throw error
  }
}

