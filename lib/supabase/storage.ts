// lib/supabase/storage.ts - Helpers for Supabase Storage interactions

import { config } from '@/lib/config'
import { getSupabaseServerClient } from './client'

type UploadOptions = {
  cacheControl?: string
  upsert?: boolean
  contentType?: string
}

export function normalizeStorageKey(key: string): string {
  return key.replace(/\\/g, '/').replace(/^\/+/, '')
}

const SUPABASE_PROTOCOL = 'supabase://'

export function encodeSupabasePath(bucket: string, key: string): string {
  return `${SUPABASE_PROTOCOL}${bucket}/${normalizeStorageKey(key)}`
}

export function isSupabasePath(path?: string | null): path is string {
  return Boolean(path && path.startsWith(SUPABASE_PROTOCOL))
}

export function decodeSupabasePath(path: string): { bucket: string; key: string } {
  if (!isSupabasePath(path)) {
    throw new Error(`Invalid Supabase path: ${path}`)
  }
  const withoutProtocol = path.substring(SUPABASE_PROTOCOL.length)
  const [bucket, ...keyParts] = withoutProtocol.split('/')
  if (!bucket || keyParts.length === 0) {
    throw new Error(`Invalid Supabase path: ${path}`)
  }
  return {
    bucket,
    key: keyParts.join('/'),
  }
}

export async function uploadPublicAsset(
  bucket: string,
  key: string,
  file: Buffer,
  options: UploadOptions = {}
) {
  const normalizedKey = normalizeStorageKey(key)
  const supabase = getSupabaseServerClient()

  const { error } = await supabase.storage.from(bucket).upload(normalizedKey, file, {
    upsert: options.upsert ?? true,
    cacheControl: options.cacheControl ?? '86400',
    contentType: options.contentType,
  })

  if (error) {
    throw new Error(`[Supabase Storage] Failed to upload public asset (${bucket}/${normalizedKey}): ${error.message}`)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedKey)

  return {
    key: normalizedKey,
    publicUrl: data.publicUrl,
  }
}

export async function uploadPrivateAsset(
  bucket: string,
  key: string,
  file: Buffer,
  options: UploadOptions = {}
) {
  const normalizedKey = normalizeStorageKey(key)
  const supabase = getSupabaseServerClient()

  const { error } = await supabase.storage.from(bucket).upload(normalizedKey, file, {
    upsert: options.upsert ?? true,
    cacheControl: options.cacheControl ?? '3600',
    contentType: options.contentType,
  })

  if (error) {
    throw new Error(`[Supabase Storage] Failed to upload private asset (${bucket}/${normalizedKey}): ${error.message}`)
  }

  const expiresIn = config.supabase.signedUrlTtl.pdf
  const { data, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedKey, expiresIn)

  if (signedError) {
    throw new Error(
      `[Supabase Storage] Failed to create signed URL for ${bucket}/${normalizedKey}: ${signedError.message}`
    )
  }

  return {
    key: normalizedKey,
    signedUrl: data.signedUrl,
  }
}

export function getPublicUrl(bucket: string, key: string) {
  const supabase = getSupabaseServerClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizeStorageKey(key))
  return data.publicUrl
}

export async function createSignedUrl(
  bucket: string,
  key: string,
  expiresIn?: number
): Promise<string> {
  const supabase = getSupabaseServerClient()
  const ttl = expiresIn ?? config.supabase.signedUrlTtl.pdf
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizeStorageKey(key), ttl)

  if (error || !data?.signedUrl) {
    throw new Error(`[Supabase Storage] Failed to create signed URL for ${bucket}/${key}: ${error?.message}`)
  }

  return data.signedUrl
}

