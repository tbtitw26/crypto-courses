// lib/jobs/parseStartResponse.ts - Helper to normalize API start response

/**
 * Normalizes the response from generation start endpoints.
 * Handles:
 * - Old format: { success, id }
 * - New format: { ok, jobId }
 * - Multi-language format: { ok, jobs: [{ jobId, language }, ...] }
 */
export function parseStartResponse(json: any): {
  ok: boolean
  jobId?: string
  jobs?: Array<{ jobId: string; language: string }>
  message?: string
  status?: string
} {
  const ok = Boolean(json?.ok ?? json?.success)
  const message = json?.message
  const status = json?.status

  // Check for multi-language format (jobs array) - always prioritize jobs array
  if (Array.isArray(json?.jobs) && json.jobs.length > 0) {
    return {
      ok,
      jobs: json.jobs.map((job: any) => ({
        jobId: String(job.jobId ?? job.id ?? ''),
        language: job.language || 'en',
      })),
      // Also include jobId from first job for backward compatibility
      jobId: String(json.jobs[0]?.jobId ?? json.jobs[0]?.id ?? json?.jobId ?? json?.id ?? ''),
      message,
      status,
    }
  }

  // Fallback to single job format (backward-compatible)
  const jobId = json?.jobId ?? json?.id
  return {
    ok,
    jobId: jobId ? String(jobId) : undefined,
    message,
    status,
  }
}

