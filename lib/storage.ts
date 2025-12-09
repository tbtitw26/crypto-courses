import fs from 'fs/promises'
import path from 'path'
import { config } from '@/lib/config'
import {
  uploadPrivateAsset,
  uploadPublicAsset,
  encodeSupabasePath,
  isSupabasePath,
  decodeSupabasePath,
  createSignedUrl,
  getPublicUrl,
  normalizeImageKey,
} from '@/lib/supabase/storage'

export interface SaveResult {
  publicPath: string
  publicUrl?: string
  storagePath?: string
  storageBucket?: string
  signedUrl?: string
  source: 'local' | 'supabase'
}

interface SaveOptions {
  buffer: Buffer
  filename: string
  subdirectory: string
}

/**
 * Saves file to local filesystem (public directory)
 * Files are stored in public/ directory and accessible via HTTP
 */
async function saveLocally({ buffer, filename, subdirectory }: SaveOptions): Promise<SaveResult> {
  const directory = path.join(process.cwd(), 'public', ...subdirectory.split('/'))
  await fs.mkdir(directory, { recursive: true })
  const filePath = path.join(directory, filename)
  await fs.writeFile(filePath, buffer)

  return {
    publicPath: `/${subdirectory}/${filename}`,
    publicUrl: `/${subdirectory}/${filename}`,
    source: 'local',
  }
}

function normalizeStorageKey(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join('/')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

function getImageMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'svg') return 'image/svg+xml'
  return 'image/webp'
}

const useSupabaseStorage = config.supabase.useStorage
const supabaseBuckets = config.supabase.buckets

async function saveCourseImageSupabase(buffer: Buffer, filename: string): Promise<SaveResult> {
  const bucket = supabaseBuckets.courseImages
  const key = normalizeStorageKey(filename)
  const contentType = getImageMimeType(filename)

  const { publicUrl } = await uploadPublicAsset(bucket, key, buffer, {
    contentType,
  })

  return {
    publicPath: publicUrl,
    publicUrl,
    storageBucket: bucket,
    storagePath: key,
    source: 'supabase',
  }
}

async function saveCoursePdfSupabase(buffer: Buffer, filename: string): Promise<SaveResult> {
  const bucket = supabaseBuckets.coursePdf
  const key = normalizeStorageKey(filename)

  const { signedUrl } = await uploadPrivateAsset(bucket, key, buffer, {
    contentType: 'application/pdf',
  })

  return {
    publicPath: encodeSupabasePath(bucket, key),
    storageBucket: bucket,
    storagePath: key,
    signedUrl,
    source: 'supabase',
  }
}

/**
 * Saves generated image to public/images/generated/
 * @returns Public path to the saved image
 */
export async function saveGeneratedImage(buffer: Buffer, filename: string): Promise<SaveResult> {
  return saveLocally({ buffer, filename, subdirectory: 'images/generated' })
}

/**
 * Saves generated PDF to public/recipes/generated/
 * @returns Public path to the saved PDF
 */
export async function saveGeneratedPdf(buffer: Buffer, filename: string): Promise<SaveResult> {
  return saveLocally({ buffer, filename, subdirectory: 'recipes/generated' })
}

/**
 * Saves course PDF to public/courses/
 * @returns Public path to the saved PDF
 */
export async function saveCoursePdf(buffer: Buffer, filename: string): Promise<SaveResult> {
  if (useSupabaseStorage) {
    return saveCoursePdfSupabase(buffer, filename)
  }
  return saveLocally({ buffer, filename, subdirectory: 'courses' })
}

/**
 * Saves course image to public/images/courses/
 * @returns Public path to the saved image
 */
export async function saveCourseImage(buffer: Buffer, filename: string): Promise<SaveResult> {
  if (useSupabaseStorage) {
    return saveCourseImageSupabase(buffer, filename)
  }
  return saveLocally({ buffer, filename, subdirectory: 'images/courses' })
}

export async function resolveDownloadUrl(storedPath?: string | null): Promise<string | undefined> {
  if (!storedPath) return undefined
  if (!isSupabasePath(storedPath)) {
    return storedPath
  }

  const { bucket, key } = decodeSupabasePath(storedPath)
  return createSignedUrl(bucket, key)
}

export function resolvePublicUrl(storedPath?: string | null): string | undefined {
  if (!storedPath) return undefined
  if (!isSupabasePath(storedPath)) {
    return storedPath
  }

  const { bucket, key } = decodeSupabasePath(storedPath)
  // Normalize legacy paths (courses/ → covers/, .webp → .png)
  const normalizedKey = normalizeImageKey(key)
  return getPublicUrl(bucket, normalizedKey)
}



