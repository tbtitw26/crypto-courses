import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

type BucketSummary = {
  bucket: string
  totalFiles: number
  totalBytes: number
  byPrefix: Record<string, { files: number; bytes: number }>
}

/**
 * Recursively list all objects in a bucket and accumulate size
 */
async function listAllObjects(bucket: string) {
  const supabase = createClient(config.supabase.url, process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  const summaries: BucketSummary = { bucket, totalFiles: 0, totalBytes: 0, byPrefix: {} }

  async function walk(prefix: string) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset: 0,
    })
    if (error) throw error
    if (!data) return

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      const size = (item as any).metadata?.size ?? (item as any).size ?? 0
      if (item.id && size !== undefined) {
        summaries.totalFiles += 1
        summaries.totalBytes += size
        const top = path.split('/')[0] || ''
        summaries.byPrefix[top] = summaries.byPrefix[top] || { files: 0, bytes: 0 }
        summaries.byPrefix[top].files += 1
        summaries.byPrefix[top].bytes += size
      }
      if (item.name && item.id === null) {
        // It's a folder; recurse
        await walk(path)
      }
    }
  }

  await walk('')
  return summaries
}

async function main() {
  if (!config.supabase.url || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const buckets = Object.values(config.supabase.buckets)
  const results: BucketSummary[] = []

  for (const bucket of buckets) {
    try {
      const summary = await listAllObjects(bucket)
      results.push(summary)
    } catch (err) {
      console.error(`Error listing bucket ${bucket}:`, err)
    }
  }

  const totalBytes = results.reduce((sum, r) => sum + r.totalBytes, 0)
  const totalFiles = results.reduce((sum, r) => sum + r.totalFiles, 0)

  console.log(JSON.stringify({ totalBytes, totalFiles, buckets: results }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

