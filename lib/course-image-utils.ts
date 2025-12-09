// lib/course-image-utils.ts - Utility functions for course images

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_IMAGES_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_COURSE_IMAGES || 'course-images'

function buildSupabaseImageUrl(key: string | null | undefined) {
  if (!key || !SUPABASE_URL) {
    return null
  }
  const normalized = key.replace(/^\//, '')
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_IMAGES_BUCKET}/${normalized}`
}

/**
 * Get the image path for a course by slug
 * Maps course slugs to image filenames
 * Uses standard pattern: covers/{slug}-cover.png inside Supabase
 */
export function getCourseImagePath(slug: string): string | null {
  if (!slug) return null

  // Explicit mappings for courses with custom paths (if any)
  const imageMap: Record<string, string> = {
    // Add any courses with non-standard image paths here
  }

  const mappedKey = imageMap[slug]
  const supabaseKey = mappedKey ?? `covers/${slug}-cover.png`
  const supabaseUrl = buildSupabaseImageUrl(supabaseKey)

  if (supabaseUrl) {
    return supabaseUrl
  }

  // Fallback to legacy public folder when Supabase URL isn't configured
  return `/images/courses/${slug}-cover.png`
}

/**
 * Check if an image exists (for client-side)
 * This is a simple check - in production, you might want to use a more robust method
 */
export function courseImageExists(slug: string): boolean {
  return getCourseImagePath(slug) !== null
}

