# Step 3 — Frontend polling (jobId → status) with minimal UI changes (Next.js App Router)

Goal of this step:
- The UI starts a generation job and immediately gets a `jobId`.
- The UI **polls** the single-job status endpoint until `ready` or `failed`.
- The user can navigate away and come back: the job continues server-side, and the UI can **resume** status by `jobId`.

⚠️ Scope note:
- Step 2 already enqueues jobs + Inngest worker updates status.
- Step 3 is **frontend only**: start + polling + UX states.
- We do **not** change page layouts/design — only add small status/progress UI where needed.

---

## 0) Preconditions (must be true)

Backend endpoints exist (from Step 2):
- `POST /api/custom-course` → returns `jobId` (or `id` alias) + initial status
- `GET /api/custom-course/[id]` → returns `{ jobId, status, stage, progress, error, result, updatedAt }`

- `POST /api/ai-strategy`
- `GET /api/ai-strategy/[id]`

---

## 1) Identify where generation is started in the UI

Task:
1. Find the UI button/form that triggers **Custom Course** generation.
2. Find the UI that triggers **AI Strategy** generation.

Deliverable:
- List the exact files/components (paths) and the function that calls `fetch("/api/custom-course" ...)` etc.

---

## 2) Normalize the start response (backward compatible)

Because backend may return either:
- `{ ok: true, jobId }` OR
- `{ success: true, id, ... }` with aliases

Implement a helper:

**`/lib/jobs/parseStartResponse.ts`** (or similar)
```ts
export function parseStartResponse(json: any): { ok: boolean; jobId?: string; message?: string } {
  const ok = Boolean(json?.ok ?? json?.success);
  const jobId = json?.jobId ?? json?.id;
  const message = json?.message;

  return { ok, jobId, message };
}
```

Use this helper in both “start” screens so you never rely on one specific field name.

---

## 3) Store `jobId` so the user can resume after navigation

Pick ONE approach (recommended: URL query param).

### Option A (recommended): add `jobId` to the URL
When start returns `{ jobId }`, do:
- `router.replace(\`?jobId=${jobId}\`)`

This allows:
- reload / refresh
- shareable resume link
- no localStorage risk

### Option B: localStorage fallback
If you do not want the URL to change, store:
- `localStorage.setItem("lastCustomCourseJobId", jobId)`

Then on page load, restore it.

---

## 4) Polling implementation

### Choose polling method based on your repo dependencies

#### A) If SWR already exists in the project (recommended)
Use SWR with `refreshInterval`.

**`/lib/jobs/fetcher.ts`**
```ts
export async function fetcher(url: string) {
  const res = await fetch(url, { cache: "no-store" }); // never cache status
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  return res.json();
}
```

**`/lib/jobs/useJobStatus.ts`**
```ts
"use client";

import useSWR from "swr";
import { fetcher } from "./fetcher";

export type JobStatus = {
  jobId: string;
  status: "in_queue" | "processing" | "ready" | "failed";
  stage?: string | null;
  progress?: number | null;
  error?: string | null;
  result?: any;
  updatedAt?: string;
};

export function useJobStatus(jobType: "custom-course" | "ai-strategy", jobId?: string) {
  const key = jobId ? `/api/${jobType}/${jobId}` : null;

  const { data, error, isLoading, mutate } = useSWR<JobStatus>(key, fetcher, {
    refreshInterval: (latest) => {
      // stop polling when job is terminal
      const status = latest?.status;
      if (status === "ready" || status === "failed") return 0;
      return 2000; // 2s polling while running
    },
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
    isTerminal: data?.status === "ready" || data?.status === "failed",
  };
}
```

#### B) If SWR is NOT used in the project
Use a safe `setTimeout` loop (avoid overlapping requests), with cleanup via AbortController.

**`/lib/jobs/useJobStatus.ts`**
```ts
"use client";

import { useEffect, useRef, useState } from "react";

type JobStatus = {
  jobId: string;
  status: "in_queue" | "processing" | "ready" | "failed";
  stage?: string | null;
  progress?: number | null;
  error?: string | null;
  result?: any;
  updatedAt?: string;
};

export function useJobStatus(jobType: "custom-course" | "ai-strategy", jobId?: string) {
  const [data, setData] = useState<JobStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      setLoading(true);

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch(`/api/${jobType}/${jobId}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        setData(json);
        setError(null);

        const status = json?.status;
        const terminal = status === "ready" || status === "failed";

        if (!terminal) {
          timerRef.current = window.setTimeout(poll, 2000);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e);
        // retry with backoff
        timerRef.current = window.setTimeout(poll, 4000);
      } finally {
        setLoading(false);
      }
    }

    poll();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [jobType, jobId]);

  const isTerminal = data?.status === "ready" || data?.status === "failed";

  return { data, error, isLoading, isTerminal };
}
```

---

## 5) Wire polling into the generation pages (minimal UI)

### 5.1 Custom Course page
Tasks:
1. On “Generate” click:
   - call `POST /api/custom-course`
   - parse response via `parseStartResponse`
   - store `jobId` (URL query or localStorage)
2. Start polling with `useJobStatus("custom-course", jobId)`
3. Render **small** status UI (no layout changes):
   - `Queued…`
   - `Generating…`
   - `Ready` (show “Open PDF” if `result.pdfUrl` exists; otherwise “Ready”)
   - `Failed` (show error + “Try again”)

### 5.2 AI Strategy page
Repeat same pattern using:
- `POST /api/ai-strategy`
- `useJobStatus("ai-strategy", jobId)`

---

## 6) UI behavior rules (keep it stable)

- Do not change existing card layouts / typography.
- Add only:
  - a small status line under the button (or inside existing “result area”)
  - a disabled state for the button while `status` is `in_queue|processing`
  - a “Retry” button on failed (calls start again and replaces jobId)

---

## 7) Resume on page load

If using URL param:
- On mount, read `const jobId = searchParams.get("jobId")`

If using localStorage:
- On mount, read last jobId and poll it.
- Provide a small “Clear” action if needed (optional).

---

## 8) Acceptance Criteria (Step 3)

1. Clicking Generate returns quickly and UI displays a `jobId`.
2. UI shows live status transitions:
   - `in_queue` → `processing` → `ready`
3. If user navigates away and returns with the same `jobId`, UI resumes and shows final status.
4. Polling stops when `ready` or `failed`.
5. No page layout redesign; only small status/progress elements are added.

---

## Notes (why cache:no-store matters)

For status polling, always use `fetch(..., { cache: "no-store" })` to avoid cached/stale responses.
This matches Next.js guidance for dynamic data fetching.
