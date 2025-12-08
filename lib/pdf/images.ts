// lib/pdf/images.ts - Image generation and download functions

import { generateImage } from '@/lib/openai/generate'
import { saveCourseImage, type SaveResult } from '@/lib/storage'
import { GeneratedCourse } from './types'

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

  // Generate image
  const { url: imageUrl } = await generateImage({
    prompt: fullPrompt,
    size,
    // quality will use default from config (medium)
    n: 1,
  })

  // Download image
  const imageBuffer = await downloadImage(imageUrl)

  const filename = `covers/${courseId}-cover.webp`
  const saveResult = await saveCourseImage(imageBuffer, filename)

  return toImagePathInfo(saveResult)
}

/**
 * Generate diagram images for course
 */
export async function generateDiagramImages(
  course: GeneratedCourse,
  courseId: string
): Promise<Record<string, ImagePathInfo>> {
  const results: Record<string, ImagePathInfo> = {}

  for (const diagram of course.diagrams) {
    try {
      // Generate image
      const { url: imageUrl } = await generateImage({
        prompt: diagram.image_prompt,
        size: '1024x1024',
        // quality will use default from config (medium)
        n: 1,
      })

      // Download image
      const imageBuffer = await downloadImage(imageUrl)

      // Save to public/images/courses/diagrams/
      const filename = `${courseId}-${diagram.diagram_id}.webp`
      // saveCourseImage saves to images/courses, so we need to adjust or use a subdir
      // Looking at saveCourseImage impl in storage.ts: return saveLocally({ ..., subdirectory: 'images/courses' })
      // So if we want images/courses/diagrams, we should probably manually join path or add a new helper.
      // But looking at existing code: 
      // const { publicPath } = await saveCourseImage(imageBuffer, filename)
      // It saves to images/courses.
      
      // Let's stick to using saveLocally directly for diagrams to put them in diagrams subdir if needed, 
      // OR reuse saveCourseImage if we don't mind them being in the root courses image dir.
      // The original code saved to public/images/courses/diagrams/.
      // But wait, saveCourseImage saves to 'images/courses'. 
      // The previous code had:
      // const { publicPath } = await saveCourseImage(imageBuffer, filename)
      // This put diagrams in 'images/courses', NOT 'images/courses/diagrams'.
      
      // Let's check storage.ts again.
      // saveCourseImage -> subdirectory: 'images/courses'
      
      // The original code:
      // const { publicPath } = await saveCourseImage(imageBuffer, filename)
      // // Also save to courses/images directory for PDF use
      // ...
      // const localPath = path.join(coursesDir, filename)
      // results[diagram.diagram_id] = { publicPath, localPath: `/courses/images/diagrams/${filename}` }
      
      // Wait, there is a discrepancy in the original code I read.
      // Original read:
      // // Save to public/images/courses/diagrams/  <-- Comment says diagrams
      // const filename = ...
      // const { publicPath } = await saveCourseImage(imageBuffer, filename) <-- Actual code saves to images/courses
      
      // // Also save to courses directory...
      // const coursesDir = path.join(process.cwd(), 'public', 'courses', 'images', 'diagrams') <-- Subdir diagrams
      // ...
      // localPath: `/courses/images/diagrams/${filename}`
      
      // So publicPath was /images/courses/foo.webp
      // And localPath was /courses/images/diagrams/foo.webp
      
      // We want to unify this. Let's put everything in /images/courses/diagrams/ if possible, 
      // or just /images/courses/ if that's easier.
      // To keep it clean, let's use a specific save for diagrams.
      
      // I will import saveLocally from storage.ts? No, it's not exported.
      // I will just use saveCourseImage but filename will include 'diagrams/' prefix?
      // storage.ts: saveLocally uses path.join(directory, filename).
      // So if filename is 'diagrams/foo.webp', it will save to 'images/courses/diagrams/foo.webp'.
      
      const storageKey = `diagrams/${courseId}/${filename}`
      const saveResult = await saveCourseImage(imageBuffer, storageKey)

      results[diagram.diagram_id] = toImagePathInfo(saveResult)
      console.log(`  ✓ Generated diagram: ${diagram.diagram_id}`)
    } catch (error) {
      console.error(`  ✗ Failed to generate diagram ${diagram.diagram_id}:`, error)
      // Continue with other diagrams - don't fail the entire process
    }
  }

  return results
}

