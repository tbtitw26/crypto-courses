// lib/course-pdf-utils.ts - Utility functions for course PDF paths

import { decodeSupabasePath, encodeSupabasePath, isSupabasePath } from '@/lib/supabase/storage'
import { resolveDownloadUrl } from '@/lib/storage'

const EN_SUFFIX = '-en.pdf'
const AR_SUFFIX = '-ar.pdf'

function swapLocaleSuffix(path: string, locale: string): string {
  const suffix = locale === 'ar' ? AR_SUFFIX : EN_SUFFIX
  if (path.includes(EN_SUFFIX) || path.includes(AR_SUFFIX)) {
    return path.replace(EN_SUFFIX, suffix).replace(AR_SUFFIX, suffix)
  }
  return path
}

function adjustSupabaseLocale(path: string, locale: string): string {
  const { bucket, key } = decodeSupabasePath(path)
  const suffix = locale === 'ar' ? AR_SUFFIX : EN_SUFFIX
  const normalizedKey =
    key.includes(EN_SUFFIX) || key.includes(AR_SUFFIX) ? key.replace(EN_SUFFIX, suffix).replace(AR_SUFFIX, suffix) : key
  return encodeSupabasePath(bucket, normalizedKey)
}

export function ensureCoursePdfLocalePath(dbPdfPath: string, locale: string = 'en'): string {
  if (!dbPdfPath) return dbPdfPath
  if (isSupabasePath(dbPdfPath)) {
    return adjustSupabaseLocale(dbPdfPath, locale)
  }
  return swapLocaleSuffix(dbPdfPath, locale)
}

export async function resolveCoursePdfUrl(dbPdfPath?: string | null, locale: string = 'en') {
  if (!dbPdfPath) return undefined
  const localizedPath = ensureCoursePdfLocalePath(dbPdfPath, locale)
  return resolveDownloadUrl(localizedPath)
}

