// lib/pdf/images.ts - Image generation and download functions

import { generateImage } from '@/lib/openai/generate'
import { saveCourseImage, type SaveResult } from '@/lib/storage'
import { GeneratedCourse } from './types'
import { logger } from './logger'

/**
 * Download image from URL or data URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  // Handle data URL (base64)
  if (url.startsWith('data:')) {
    const base64Data = url.split(',')[1]
    return Buffer.from(base64Data, 'base64')
  }
  
  // Handle regular URL
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Generate cover image for course
 */
type ImagePathInfo = {
  publicPath: string
  localPath?: string
}

function toImagePathInfo(result: SaveResult): ImagePathInfo {
  const publicPath = result.publicUrl ?? result.publicPath
  return {
    publicPath,
    localPath: result.source === 'local' ? publicPath : undefined,
  }
}

export async function generateCoverImage(
  course: GeneratedCourse,
  courseId: string
): Promise<ImagePathInfo> {
  logger.startTiming('cover-image-generation')
  const { image_prompt, negative_prompt, suggested_format } = course.cover.image_generation

  // Build full prompt with negative prompt
  const fullPrompt = `${image_prompt}. ${negative_prompt ? `Avoid: ${negative_prompt}` : ''}`

  // Determine size based on aspect ratio
  // GPT Image 1 mini supports: '1024x1024', '1024x1536', '1536x1024', 'auto'
  let size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1024'
  if (suggested_format.aspect_ratio === '3:4') {
    size = '1024x1536' // Portrait (closest to 3:4 ratio)
  } else if (suggested_format.aspect_ratio === '4:5') {
    size = '1024x1024' // Square-ish
  } else if (suggested_format.aspect_ratio === '16:9' || suggested_format.aspect_ratio === '4:3') {
    size = '1536x1024' // Landscape (horizontal) - wider than tall
  }

  await logger.info(`🎨 Generating cover image (size: ${size})...`, {
    promptLength: fullPrompt.length,
    aspectRatio: suggested_format.aspect_ratio,
  })

  // Generate image
  const { url: imageUrl } = await generateImage({
    prompt: fullPrompt,
    size,
    // quality will use default from config (medium)
    n: 1,
  })

  await logger.info(`📥 Downloading cover image from OpenAI...`)

  // Download image
  const imageBuffer = await downloadImage(imageUrl)

  await logger.info(`💾 Saving cover image (${(imageBuffer.length / 1024).toFixed(2)} KB)...`)

  const filename = `covers/${courseId}-cover.png`
  const saveResult = await saveCourseImage(imageBuffer, filename)

  await logger.endTiming('cover-image-generation', '✅ Cover image generated and saved')

  return toImagePathInfo(saveResult)
}

/**
 * Generate diagram images for course
 */
export async function generateDiagramImages(
  course: GeneratedCourse,
  courseId: string
): Promise<Record<string, ImagePathInfo>> {
  logger.startTiming('diagrams-generation')
  const results: Record<string, ImagePathInfo> = {}
  const diagramCount = course.diagrams?.length || 0

  await logger.info(`📊 Generating ${diagramCount} diagram image(s)...`)

  for (let i = 0; i < diagramCount; i++) {
    const diagram = course.diagrams[i]
    try {
      logger.startTiming(`diagram-${diagram.diagram_id}`)
      await logger.info(`  [${i + 1}/${diagramCount}] Generating diagram: ${diagram.diagram_id}...`)

      // Generate image
      const { url: imageUrl } = await generateImage({
        prompt: diagram.image_prompt,
        size: '1024x1024',
        // quality will use default from config (medium)
        n: 1,
      })

      await logger.info(`  [${i + 1}/${diagramCount}] Downloading diagram image...`)

      // Download image
      const imageBuffer = await downloadImage(imageUrl)

      await logger.info(`  [${i + 1}/${diagramCount}] Saving diagram (${(imageBuffer.length / 1024).toFixed(2)} KB)...`)

      // Save to public/images/courses/diagrams/
      const filename = `${courseId}-${diagram.diagram_id}.webp`
      const storageKey = `diagrams/${courseId}/${filename}`
      const saveResult = await saveCourseImage(imageBuffer, storageKey)

      results[diagram.diagram_id] = toImagePathInfo(saveResult)
      await logger.endTiming(`diagram-${diagram.diagram_id}`, `  ✓ [${i + 1}/${diagramCount}] Diagram ${diagram.diagram_id} generated`)
    } catch (error) {
      await logger.endTiming(`diagram-${diagram.diagram_id}`)
      const errorMessage = error instanceof Error ? error.message : String(error)
      await logger.error(`  ✗ [${i + 1}/${diagramCount}] Failed to generate diagram ${diagram.diagram_id}:`, {
        error: errorMessage,
        diagramId: diagram.diagram_id,
      })
      // Continue with other diagrams - don't fail the entire process
    }
  }

  await logger.endTiming('diagrams-generation', `✅ Generated ${Object.keys(results).length}/${diagramCount} diagram(s)`)

  return results
}

