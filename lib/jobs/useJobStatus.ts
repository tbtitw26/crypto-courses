// lib/jobs/useJobStatus.ts - Hook for polling job status (without SWR)

'use client'

import { useEffect, useRef, useState } from 'react'

export type JobStatus = {
  jobId: string
  status: 'in_queue' | 'processing' | 'ready' | 'failed'
  stage?: string | null
  progress?: number | null
  error?: string | null
  result?: {
    pdfUrl?: string
  } | null
  updatedAt?: string
}

export function useJobStatus(jobType: 'custom-course' | 'ai-strategy', jobId?: string) {
  const [data, setData] = useState<JobStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setLoading] = useState(false)
  const timerRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!jobId) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function poll() {
      if (cancelled) return
      setLoading(true)

      // Abort previous request if still pending
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      try {
        const res = await fetch(`/api/${jobType}/${jobId}`, {
          cache: 'no-store', // Critical: never cache status
          signal: ac.signal,
        })

        if (!res.ok) {
          throw new Error(`Status fetch failed: ${res.status}`)
        }

        const json = await res.json()
        if (cancelled) return

        setData(json)
        setError(null)

        const status = json?.status
        const terminal = status === 'ready' || status === 'failed'

        // Stop polling if terminal state
        if (!terminal) {
          timerRef.current = window.setTimeout(poll, 2000) // 2s polling while running
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e)
        // Retry with backoff on error
        timerRef.current = window.setTimeout(poll, 4000)
      } finally {
        setLoading(false)
      }
    }

    // Start polling immediately
    poll()

    return () => {
      cancelled = true
      abortRef.current?.abort()
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [jobType, jobId])

  const isTerminal = data?.status === 'ready' || data?.status === 'failed'

  return {
    data,
    error,
    isLoading,
    isTerminal,
  }
}

