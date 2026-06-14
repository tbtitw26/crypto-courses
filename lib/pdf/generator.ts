// lib/pdf/generator.ts - Course generation functions

import { getOpenAIClient, getModelForFeature } from '@/lib/openai/client'
import { config } from '@/lib/config'
import { GeneratedCourse, CourseGenerationInput } from './types'
import { COURSE_JSON_SCHEMA, CUSTOM_COURSE_JSON_SCHEMA } from './schema'

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

/**
 * Build system prompt for course generation
 */
function buildCourseSystemPrompt(): string {
  return `You are a senior course architect for Cur Nova (cur-nova.com), a premium education-only platform for high-risk trading markets (Forex, Crypto, Binary options). You create print-friendly PDF course manuscripts.

NON-NEGOTIABLE COMPLIANCE RULES:
- Education only. Not financial advice. Not investment advice.
- No promises, no performance claims, no hype, no 'easy money'.
- No real-time calls. No 'buy now / sell now'. No live price targets.
- Always frame trading as high risk with possibility of total loss.
- Examples must be hypothetical and timeless.

STYLE RULES:
- Calm mentor tone: serious, structured, approachable.
- Minimal jargon; define jargon immediately in plain language.
- Prefer short paragraphs, checklists, and clear headings.
- Avoid emojis, memes, slang.
- CRITICAL: Be extremely concise: use shorter paragraphs, avoid redundancy, prioritize essential content.
- Keep examples brief and focused to stay within token limits.
- For complex topics: focus on core concepts, skip lengthy explanations.
- Use bullet points and lists instead of long paragraphs where possible.

COVER IMAGE REQUIREMENTS:
- The cover image MUST be horizontal/landscape orientation (wider than tall, aspect ratio 16:9 or 4:3).
- This leaves more space at the bottom for text content (title, subtitle, tagline, and chips).
- The image should be professional and educational, suitable for a trading education course.

OUTPUT RULES:
- Output MUST match the provided JSON schema exactly (Structured Outputs).
- Write the course in ENGLISH.
- Make the manuscript PDF-ready: each section should be usable as-is by a renderer.
- Do NOT include external links.
- Keep binary options content strictly educational and risk-forward.`
}

/**
 * Build user prompt from input data
 */
function buildCourseUserPrompt(input: CourseGenerationInput, courseId: string): string {
  const {
    course_title,
    short_description,
    target_audience,
    markets_covered,
    must_cover_topics,
    deliverable_requirements,
    quality_bar,
    intended_pages_range = '25-40',
    level = 'Beginner',
  } = input

  return `Create a complete, detailed ready-made PDF course for Cur Nova.

Course title:
${course_title}

Short description:
${short_description}

Target audience:
${target_audience.map((a) => `- ${a}`).join('\n')}

Markets covered (education-only overview):
${markets_covered.map((m) => `- ${m}`).join('\n')}
(Explain differences in mechanics and risk. Do not recommend any product, broker, exchange, or platform.)

MUST-COVER TOPICS:
${must_cover_topics.map((topic, i) => `${i + 1}) ${topic}`).join('\n')}

${deliverable_requirements ? `DELIVERABLE REQUIREMENTS:\n${deliverable_requirements.join('\n')}\n` : ''}

QUALITY BAR:
${quality_bar || "This must feel premium and professional. Explain 'why it matters' after each core concept. Use short hypothetical examples. Keep it educational, no instructions to trade live markets."}
- Aim for ~${intended_pages_range} PDF pages when rendered.

CRITICAL TOKEN EFFICIENCY (MUST FOLLOW):
- Generate compact, efficient content. Avoid verbosity and unnecessary repetition.
- Stay STRICTLY within the 16K token limit. If approaching the limit, prioritize essential information.
- Use concise language while maintaining quality and clarity.
- For courses with many topics: reduce module count to 6-8 modules instead of 8-10 if needed.
- Keep lesson content brief: 2-3 paragraphs max per lesson.
- Use bullet points and checklists instead of long paragraphs.
- Limit examples to 1-2 per concept, keep them very brief.
- If token limit is approached, reduce content in non-critical sections (glossary, quiz explanations).

COURSE ID: ${courseId}
LEVEL: ${level}

Now generate the course in the required schema.`
}

/**
 * Generate course in English via OpenAI
 */
export async function generateCourseEn(input: CourseGenerationInput): Promise<GeneratedCourse> {
  const client = getOpenAIClient()
  const model = getModelForFeature('course')
  const settings = config.openai.settings.course
  const timeout = config.openai.timeouts.course

  const courseId = generateCourseId(input.course_title)
  const systemPrompt = buildCourseSystemPrompt()
  const userPrompt = buildCourseUserPrompt(input, courseId)

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
        max_tokens: settings.maxTokens, // GPT-4o mini uses max_tokens (not max_completion_tokens)
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'avenqor_ready_course_with_rendering_v1',
            strict: true,
            schema: COURSE_JSON_SCHEMA as any,
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

    // Check if response was truncated (GPT-4o mini has 16K token limit)
    const completionTokens = response.usage?.completion_tokens || 0
    const maxTokens = settings.maxTokens
    const isTruncated = completionTokens >= maxTokens * 0.95
    
    if (isTruncated) {
      console.warn(
        `⚠️ WARNING: Response is close to token limit (${completionTokens}/${maxTokens} tokens). ` +
        `Course content may be truncated.`
      )
    }

    // Parse and validate JSON
    let parsedContent: GeneratedCourse
    try {
      parsedContent = JSON.parse(content) as GeneratedCourse
    } catch (parseError) {
      // If JSON parsing failed and response was truncated, throw a more specific error
      if (isTruncated) {
        throw {
          code: 'TRUNCATED_JSON',
          message: `Response was truncated at token limit (${completionTokens}/${maxTokens}). JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          details: { completionTokens, maxTokens, parseError },
        }
      }
      throw new Error(`Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Ensure course_id matches
    parsedContent.meta.course_id = courseId
    parsedContent.meta.language = 'EN'
    parsedContent.meta.created_at_iso = new Date().toISOString()

    return parsedContent
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        code: 'TIMEOUT',
        message: 'Course generation request timed out',
        details: error,
      }
    }

    if (error && typeof error === 'object' && 'code' in error) {
      throw {
        code: (error as { code: string }).code || 'UNKNOWN',
        message: error instanceof Error ? error.message : 'OpenAI API error',
        details: error,
      }
    }

    throw {
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error,
    }
  }
}

/**
 * Translate course from English to Arabic via OpenAI
 * @param courseEn - The English course to translate
 * @param schema - Optional JSON schema to use for validation. Defaults to COURSE_JSON_SCHEMA.
 *                 Use CUSTOM_COURSE_JSON_SCHEMA for Custom Courses.
 */
export async function translateCourseToArabic(
  courseEn: GeneratedCourse,
  schema: any = COURSE_JSON_SCHEMA
): Promise<GeneratedCourse> {
  const client = getOpenAIClient()
  const model = getModelForFeature('course')
  const settings = config.openai.settings.course
  // Use translation timeout if available, otherwise fall back to course timeout
  const timeout = config.openai.timeouts.translation || config.openai.timeouts.course

  const systemPrompt = `You are a professional translator specializing in financial and educational content translation from English to Arabic.

TRANSLATION RULES:
- Translate all text content from English to Arabic (Modern Standard Arabic).
- Maintain the exact JSON structure and field names.
- Keep technical terms in English if commonly used in Arabic trading context, or provide Arabic translation with English in parentheses.
- Preserve all anchor_id, module_id, lesson_id, diagram_id values exactly as they are.
- Maintain the same tone: serious, structured, approachable.
- Ensure RTL (right-to-left) text will render correctly in PDF.
- Be efficient with tokens: translate accurately but concisely.

OUTPUT:
- Return the complete translated course in the same JSON schema.
- All text fields must be in Arabic except IDs and technical identifiers.
- Use compact JSON format (no unnecessary whitespace).`

  // Use compact JSON (no formatting) to save tokens
  const userPrompt = `Translate this English course to Arabic. Maintain the exact JSON structure. Be concise but accurate.

${JSON.stringify(courseEn)}`

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
        max_tokens: settings.maxTokens, // GPT-4o mini uses max_tokens (not max_completion_tokens)
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'avenqor_ready_course_with_rendering_v1',
            strict: true,
            schema: schema as any,
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

    // Check if response was truncated (GPT-4o mini has 16K token limit)
    const completionTokens = response.usage?.completion_tokens || 0
    const maxTokens = settings.maxTokens
    if (completionTokens >= maxTokens * 0.95) {
      console.warn(
        `⚠️ WARNING: Translation response is close to token limit (${completionTokens}/${maxTokens} tokens). ` +
        `Content may be truncated.`
      )
    }

    let parsedContent: GeneratedCourse
    try {
      parsedContent = JSON.parse(content) as GeneratedCourse
    } catch (parseError) {
      throw new Error(`Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Update language and preserve course_id
    parsedContent.meta.language = 'AR'
    parsedContent.meta.course_id = courseEn.meta.course_id
    parsedContent.meta.created_at_iso = courseEn.meta.created_at_iso

    return parsedContent
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        code: 'TIMEOUT',
        message: 'Translation request timed out',
        details: error,
      }
    }

    throw {
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error,
    }
  }
}

