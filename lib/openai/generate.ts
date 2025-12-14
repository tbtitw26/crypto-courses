// lib/openai/generate.ts - OpenAI generation functions

import { getOpenAIClient, getModelForFeature, OPENAI_MODELS } from './client'
import {
  buildSystemMessageCompact,
  buildCustomCoursePrompt,
  buildAIStrategyPrompt,
} from './prompts'
import { config } from '@/lib/config'
import { COURSE_JSON_SCHEMA, CUSTOM_COURSE_JSON_SCHEMA, AI_STRATEGY_JSON_SCHEMA, COMPACT_CUSTOM_COURSE_JSON_SCHEMA, COMPACT_AI_STRATEGY_JSON_SCHEMA } from '@/lib/pdf/schema'
import { GeneratedCourse } from '@/lib/pdf/types'
import { logger } from '@/lib/pdf/logger'

export interface GenerationResult {
  content: string | object
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
}

export interface GenerationError {
  code: string
  message: string
  details?: unknown
}

/**
 * Generate AI Strategy (full GeneratedCourse structure)
 */
export async function generateAIStrategy(params: {
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
  language?: string
  languages?: string[] // Added for consistency with Custom Course
}): Promise<{ course: GeneratedCourse; tokens: { prompt: number; completion: number; total: number }; model: string }> {
  const client = getOpenAIClient()
  const model = getModelForFeature('strategy')
  const settings = config.openai.settings.strategy
  const timeout = config.openai.timeouts.strategy

  // Generate course ID from main objective
  const courseId = generateCourseId(params.mainObjective.substring(0, 50))
  
  // Get language from params (default to 'en')
  const language = (params.language || 'en') as 'en' | 'ar'
  const systemPrompt = buildSystemMessageCompact(language)
  const userPrompt = buildAIStrategyPrompt({ ...params, courseId, languages: params.language ? [params.language] : undefined })

  const attempts = 2
  let lastError: any = null

  for (let i = 0; i < attempts; i++) {
    const attempt = i + 1
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'avenqor_ai_strategy_compact_v1',
            strict: true,
            schema: COMPACT_AI_STRATEGY_JSON_SCHEMA as any,
          },
        },
        },
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
      }

      // Parse and validate JSON
      let parsedContent: GeneratedCourse
      try {
        parsedContent = JSON.parse(content) as GeneratedCourse
        // Ensure course_id matches
        parsedContent.meta.course_id = courseId
      } catch (parseError) {
        throw new Error(`Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
      }

      return {
        course: parsedContent,
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
        model: response.model,
      }
    } catch (error: unknown) {
      lastError = error
      const isAbort =
        (error instanceof Error && error.name === 'AbortError') ||
        (error as any)?.message?.toString?.().toLowerCase?.().includes('aborted')
      const isOpenAIError = error && typeof error === 'object' && 'code' in error

      // Retry on first attempt for abort/unknown
      if (attempt < attempts && (isAbort || isOpenAIError)) {
        const delay = 1500 * attempt
        await new Promise((res) => setTimeout(res, delay))
        continue
      }

      if (isAbort) {
        throw {
          code: 'TIMEOUT',
          message: 'Generation request timed out',
          details: error,
        } as GenerationError
      }

      if (isOpenAIError) {
        throw {
          code: (error as { code: string }).code || 'UNKNOWN',
          message: error instanceof Error ? error.message : 'OpenAI API error',
          details: error,
        } as GenerationError
      }

      throw {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      } as GenerationError
    }
  }

  throw {
    code: 'UNKNOWN',
    message: 'Failed after retries',
    details: lastError,
  } as GenerationError
}

/**
 * Generate course ID from title or user profile
 */
function generateCourseId(titleOrProfile: string): string {
  return titleOrProfile
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

/**
 * Generate Custom Course (full GeneratedCourse structure)
 */
export async function generateCustomCourse(params: {
  experienceYears: string
  depositBudget: string
  riskTolerance: string
  markets: string[]
  tradingStyle: string
  timeCommitment?: string
  goalsFreeText: string
  additionalNotes?: string
  languages: string[] // Changed from language?: string to languages: string[]
}): Promise<{ course: GeneratedCourse; tokens: { prompt: number; completion: number; total: number }; model: string }> {
  const client = getOpenAIClient()
  const model = getModelForFeature('customCourse')
  const settings = config.openai.settings.customCourse
  const timeout = config.openai.timeouts.course

  // Generate course ID from goals (main objective)
  const courseId = generateCourseId(params.goalsFreeText.substring(0, 50))
  
  // Get language from params (default to 'en')
  const language = (params.languages?.[0] || 'en') as 'en' | 'ar'
  const systemPrompt = buildSystemMessageCompact(language)
  const userPrompt = buildCustomCoursePrompt({ ...params, courseId })

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'avenqor_custom_course_compact_v1',
            strict: true,
            schema: COMPACT_CUSTOM_COURSE_JSON_SCHEMA as any,
          },
        },
      },
      { signal: controller.signal }
    )

    clearTimeout(timeoutId)

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw {
        code: 'NO_CONTENT',
        message: 'No content in OpenAI response',
        details: { response: response.choices[0] },
      } as GenerationError
    }

    // Check if response was truncated
    const finishReason = response.choices[0]?.finish_reason
    const completionTokens = response.usage?.completion_tokens || 0
    const maxTokens = settings.maxTokens
    const contentLength = content.length
    
    // Multiple checks for truncation:
    // 1. finish_reason === 'length' (explicit truncation)
    // 2. completionTokens >= 95% of maxTokens (close to limit)
    // 3. completionTokens >= maxTokens (at or over limit)
    const isTruncatedByReason = finishReason === 'length'
    const isTruncatedByTokens = completionTokens >= maxTokens * 0.95 || completionTokens >= maxTokens

    // Parse and validate JSON
    let parsedContent: GeneratedCourse
    try {
      parsedContent = JSON.parse(content) as GeneratedCourse
      // Ensure course_id matches
      parsedContent.meta.course_id = courseId
    } catch (parseError) {
      const parseErrorMessage = parseError instanceof Error ? parseError.message : 'Unknown error'
      
      // Extract error position from "Unterminated string in JSON at position X"
      let errorPosition: number | null = null
      if (parseErrorMessage.includes('position')) {
        const positionMatch = parseErrorMessage.match(/position (\d+)/)
        if (positionMatch) {
          errorPosition = parseInt(positionMatch[1], 10)
        }
      }
      
      // Additional check: if error position is > 80% of content length, likely truncated
      const isTruncatedByPosition = errorPosition !== null && errorPosition > contentLength * 0.8
      
      // Determine if response was truncated
      const isTruncated = isTruncatedByReason || isTruncatedByTokens || isTruncatedByPosition
      
      // Log detailed information for debugging (using logger to write to file)
      await logger.error('[Custom Course Generation] JSON parsing failed:', {
        finishReason,
        completionTokens,
        maxTokens,
        contentLength,
        errorPosition,
        isTruncatedByReason,
        isTruncatedByTokens,
        isTruncatedByPosition,
        isTruncated,
        parseErrorMessage,
      })
      
      // If JSON parsing failed and response was truncated, provide specific error
      if (isTruncated) {
        throw {
          code: 'TRUNCATED_JSON',
          message: `Response was truncated at token limit (${completionTokens}/${maxTokens}). JSON parsing failed: ${parseErrorMessage}`,
          details: { 
            completionTokens, 
            maxTokens, 
            finishReason, 
            contentLength,
            errorPosition,
            parseError,
            truncationChecks: {
              byReason: isTruncatedByReason,
              byTokens: isTruncatedByTokens,
              byPosition: isTruncatedByPosition,
            },
          },
        } as GenerationError
      }
      
      // If not truncated, still throw GenerationError with proper code
      throw {
        code: 'INVALID_JSON',
        message: `Invalid JSON response from OpenAI: ${parseErrorMessage}`,
        details: { 
          completionTokens, 
          maxTokens, 
          finishReason, 
          contentLength,
          errorPosition,
          parseError,
        },
      } as GenerationError
    }

    return {
      course: parsedContent,
      tokens: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
      model: response.model,
    }
  } catch (error: unknown) {
    // Log the incoming error first for debugging
    try {
      // Extract error message properly - check for message property in object first
      let errorMessageForLog: string
      if (error instanceof Error) {
        errorMessageForLog = error.message
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessageForLog = (error as any).message || String(error)
      } else {
        errorMessageForLog = String(error)
      }

      await logger.error('[Custom Course Generation] Caught error in generateCustomCourse:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage: errorMessageForLog,
        hasCode: error && typeof error === 'object' && 'code' in error,
        errorCode: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
        fullError: error,
      })
    } catch (logError) {
      // Ignore logger errors, but log to console as fallback
      console.error('[Custom Course Generation] Failed to log error:', logError)
    }

    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      await logger.error('[Custom Course Generation] Request timed out (AbortError)')
      throw {
        code: 'TIMEOUT',
        message: 'Generation request timed out',
        details: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      } as GenerationError
    }

    // If error is already a GenerationError object (has code property)
    if (error && typeof error === 'object' && 'code' in error) {
      const errorObj = error as any
      // Properly extract message and details from the error object
      const errorCode = errorObj.code || 'UNKNOWN'
      const errorMessage = errorObj.message || (error instanceof Error ? error.message : 'OpenAI API error')
      const errorDetails = errorObj.details || {}
      
      // Log the error before re-throwing (use await to ensure it's written)
      try {
        await logger.error(`[Custom Course Generation] Re-throwing error with code: ${errorCode}`, {
          code: errorCode,
          message: errorMessage,
          details: errorDetails,
          originalError: error,
        })
      } catch (logError) {
        // Ignore logger errors, but log to console as fallback
        console.error('[Custom Course Generation] Failed to log re-throw:', logError)
      }
      
      throw {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
      } as GenerationError
    }

    // Unknown error - extract what we can
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error 
      ? { 
          stack: error.stack, 
          name: error.name,
          message: error.message,
        } 
      : { error: String(error) }
    
    // Log unknown error
    try {
      await logger.error('[Custom Course Generation] Unknown error type:', {
        errorMessage,
        errorDetails,
        fullError: error,
      })
    } catch (logError) {
      console.error('[Custom Course Generation] Failed to log unknown error:', logError)
    }
    
    throw {
      code: 'UNKNOWN',
      message: errorMessage,
      details: errorDetails,
    } as GenerationError
  }
}

/**
 * Generate Image (for future use with GPT Image 1 or DALL-E)
 */
export async function generateImage(params: {
  prompt: string
  size?: '1024x1024' | '1024x1536' | '1536x1024' | 'auto' // GPT Image 1 mini supported sizes
  quality?: 'low' | 'medium' | 'high' | 'auto' // GPT Image 1 mini quality values
  n?: number
}): Promise<{ url: string; revisedPrompt?: string }> {
  const client = getOpenAIClient()
  const model = getModelForFeature('image')
  const settings = config.openai.settings.image
  const timeout = config.openai.timeouts.image

  const { prompt, size = settings.size as any, quality = settings.quality as any, n = settings.n } = params

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await client.images.generate(
      {
        model,
        prompt,
        size,
        quality,
        n,
      },
      { signal: controller.signal }
    )

    clearTimeout(timeoutId)

    const imageUrl = response.data?.[0]?.url
    const imageB64Json = response.data?.[0]?.b64_json
    
    if (!imageUrl && !imageB64Json) {
      console.error('Full OpenAI response:', JSON.stringify(response, null, 2))
      throw new Error(`No image URL or b64_json in OpenAI response. Response data: ${JSON.stringify(response.data)}`)
    }

    // GPT Image 1 mini might return b64_json instead of URL
    // Convert base64 to data URL for download
    if (imageB64Json && !imageUrl) {
      return {
        url: `data:image/png;base64,${imageB64Json}`,
        revisedPrompt: response.data?.[0]?.revised_prompt,
      }
    }

    return {
      url: imageUrl!,
      revisedPrompt: response.data?.[0]?.revised_prompt,
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        code: 'TIMEOUT',
        message: 'Image generation request timed out',
        details: error,
      } as GenerationError
    }

    throw {
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error,
    } as GenerationError
  }
}

