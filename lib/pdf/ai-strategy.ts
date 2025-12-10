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
    logger.startTiming('ai-strategy-generation')
    await logger.info('📝 Starting AI Strategy generation...', {
      languages: params.languages,
      markets: params.markets,
      tradingStyle: params.tradingStyle,
      mainObjective: params.mainObjective.substring(0, 100),
    })

    // Step 1: Generate English strategy
    logger.startTiming('openai-generation')
    await logger.info('📝 Step 1/5: Generating AI Strategy content via OpenAI...')
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
    await logger.endTiming('openai-generation', '✅ Step 1/5: AI Strategy content generated')

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
        await logger.info('🌐 Step 4/5: Translating strategy to Arabic...')
        courseAr = await translateCourseToArabic(courseEn, AI_STRATEGY_JSON_SCHEMA)
        await logger.endTiming('arabic-translation', '✅ Step 4/5: Arabic translation completed')
      } catch (error) {
        await logger.endTiming('arabic-translation')
        const errorMessage = error instanceof Error ? error.message : String(error)
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
      const pdfEn = await generateCoursePdf(courseEn, coverImagePublicPath, diagramImagePaths, courseId, 'EN', 'ai-strategy')
      pdfEnPath = pdfEn.publicPath
      pdfEnBuffer = pdfEn.buffer
      await logger.endTiming('pdf-en', `✅ Step 5/5: English PDF saved`)
      await logger.info(`📄 English PDF: ${pdfEnPath} (${(pdfEnBuffer.length / 1024).toFixed(2)} KB)`)
    }

    if (needsArabic && courseAr) {
      logger.startTiming('pdf-ar')
      await logger.info('📄 Generating Arabic PDF...')
      const pdfAr = await generateCoursePdf(courseAr, coverImagePublicPath, diagramImagePaths, courseId, 'AR', 'ai-strategy')
      pdfArPath = pdfAr.publicPath
      pdfArBuffer = pdfAr.buffer
      await logger.endTiming('pdf-ar', `✅ Arabic PDF saved`)
      await logger.info(`📄 Arabic PDF: ${pdfArPath} (${(pdfArBuffer.length / 1024).toFixed(2)} KB)`)
    } else if (needsArabic && !courseAr) {
      warnings.push('Arabic PDF not generated due to translation failure')
    }

    const totalDuration = await logger.endTiming('ai-strategy-generation', '✅ AI Strategy generation completed successfully!')
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
      tokens,
      model,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object'
        ? JSON.stringify(error)
        : String(error)
    await logger.error('❌ Error in AI Strategy generation:', { error: errorMessage })
    throw error
  }
}

