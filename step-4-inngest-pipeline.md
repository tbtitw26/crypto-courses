# Step 4 — Real Inngest pipelines: LLM → PDF → Supabase Storage → DB “ready/failed”

This step replaces the placeholder Inngest workers with a **production-grade**, durable workflow that:
1) generates content (LLM)  
2) renders a small PDF (2–3 pages)  
3) uploads PDF to **Supabase Storage**  
4) updates Neon (Prisma) so the UI can poll and show the final download link

Inngest will run your function code via `/api/inngest` (App Router requires **GET/POST/PUT**).  
Every side-effect must be inside `step.run()` so steps are memoized and retried safely.

---

## What this step delivers

- ✅ Two durable workers:
  - `custom_course/requested` → pipeline
  - `ai_strategy/requested` → pipeline
- ✅ Idempotency / dedupe:
  - event-level dedupe using `id` in `inngest.send(...)` (24h window)
  - worker-level guard (don’t re-process completed jobs)
- ✅ DB stage/progress updates used by Step 3 UI
- ✅ PDF uploaded to Supabase Storage
- ✅ Status endpoints return a valid `pdfUrl` (public URL or signed URL)

---

## 0) Vercel runtime constraints (keep steps small)

On Vercel Hobby, function duration is limited (and configurable) up to 300s.  
Set `maxDuration` on the `/api/inngest` route and keep each step comfortably below the limit.

**Task: update `/app/api/inngest/route.ts`**:
```ts
export const runtime = "nodejs";
export const maxDuration = 300;
```

---

## 1) Environment variables (Vercel only — no .env required)

Add in Vercel Environment Variables:

### Inngest
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

### Supabase (server-side, NEVER expose to client)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  (server-only)
- `SUPABASE_PDF_BUCKET`        (e.g. `pdfs`)
- `SUPABASE_PDF_BUCKET_PUBLIC` (`true` or `false`)

> If bucket is private (recommended), you’ll return **signed URLs** on demand.

---

## 2) Supabase server client helper

Create: **`/lib/supabase/server.ts`**
```ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
```

---

## 3) Data model requirements (Neon / Prisma)

For each job type table (Custom Course / AI Strategy), ensure fields exist:

Minimum:
- `id`
- `userId`
- `status`   (`in_queue|processing|ready|failed`)
- `stage`    (string, e.g. `queued|generating|rendering|uploading|done`)
- `progress` (int or float)
- `error`    (string nullable)
- `pdfPath`  (string nullable)  // storage object path
- `pdfBucket` (string nullable)

Optional but useful:
- `resultJson` (JSON) — store generated outline/content for debugging
- `language` (`en|ar`)
- timestamps

If missing: add via Prisma migration.

---

## 4) Fix Step 2 event sending: add dedupe `id`

In start endpoints where you call `inngest.send(...)`, set an event `id` so retries/double clicks don’t enqueue duplicates.

Example for Custom Course:
```ts
await inngest.send({
  id: `custom_course/requested:${jobId}`,
  name: "custom_course/requested",
  data: { jobId, userId, language, requestedAt: new Date().toISOString() },
});
```

Example for AI Strategy:
```ts
await inngest.send({
  id: `ai_strategy/requested:${jobId}`,
  name: "ai_strategy/requested",
  data: { jobId, userId, language, requestedAt: new Date().toISOString() },
});
```

---

## 5) Replace placeholder workers with real pipelines

Edit: **`/inngest/functions.ts`**

### 5.1 Common helpers (DB status updates)

Create helper functions that update job status/stage/progress.
Wrap DB writes in `step.run()` inside the worker (do not call Prisma directly outside steps).

Example “set processing” step id:
- `db:set-processing`
- `db:set-stage-generating`
- `db:set-ready`
- `db:set-failed`

### 5.2 Worker config: concurrency & safety

Configure concurrency so one user can’t spam jobs and to avoid OpenAI/Supabase spikes.

Recommended start:
- global limit: 5
- per-user key limit: 1 (so one user runs at a time)

Example:
```ts
{
  id: "custom-course-pipeline",
  concurrency: [
    { limit: 5 },
    { key: "event.data.userId", limit: 1 },
  ],
}
```

(Adjust later based on your traffic.)

### 5.3 Custom Course pipeline (real)

Trigger: `custom_course/requested`

Pseudo-structure:

```ts
import { inngest, NonRetriableError } from "inngest";
import { prisma } from "@/lib/db"; // wherever Prisma client lives
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const customCoursePipeline = inngest.createFunction(
  {
    id: "custom-course-pipeline",
    concurrency: [
      { limit: 5 },
      { key: "event.data.userId", limit: 1 },
    ],
  },
  { event: "custom_course/requested" },
  async ({ event, step }) => {
    const { jobId, userId, language } = event.data;

    // (A) Load job + guard
    const job = await step.run("db:load-job", async () => {
      const row = await prisma.customCourseRun.findUnique({ where: { id: jobId } });
      return row;
    });

    if (!job) throw new NonRetriableError(`Job not found: ${jobId}`);

    // If already ready, exit (idempotency guard)
    if (job.status === "ready") return { ok: true, jobId, alreadyDone: true };

    // (B) Mark processing + stage
    await step.run("db:set-processing", async () => {
      await prisma.customCourseRun.update({
        where: { id: jobId },
        data: { status: "processing", stage: "generating", progress: 5, error: null },
      });
    });

    // (C) Generate content (use your compact prompt v2)
    const content = await step.run("llm:generate", async () => {
      // call your existing generator code here
      // MUST be inside step.run
      return await generateCustomCourseContent({ jobId, userId, language });
    });

    await step.run("db:store-content", async () => {
      await prisma.customCourseRun.update({
        where: { id: jobId },
        data: { resultJson: content, stage: "rendering", progress: 60 },
      });
    });

    // (D) Render PDF (2–3 pages only)
    const pdfBytes = await step.run("pdf:render", async () => {
      // Use your existing PDF render function, but ensure it returns Buffer/Uint8Array
      return await renderCustomCoursePdf({ content, language });
    });

    await step.run("db:set-uploading", async () => {
      await prisma.customCourseRun.update({
        where: { id: jobId },
        data: { stage: "uploading", progress: 85 },
      });
    });

    // (E) Upload to Supabase Storage
    const bucket = process.env.SUPABASE_PDF_BUCKET!;
    const objectPath = `courses/${userId}/${jobId}.pdf`;

    await step.run("storage:upload", async () => {
      const supabase = createSupabaseServerClient();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(objectPath, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) throw error;
    });

    // (F) Mark ready (store path)
    await step.run("db:set-ready", async () => {
      await prisma.customCourseRun.update({
        where: { id: jobId },
        data: {
          status: "ready",
          stage: "done",
          progress: 100,
          pdfBucket: bucket,
          pdfPath: objectPath,
          error: null,
        },
      });
    });

    return { ok: true, jobId };
  }
);
```

### 5.4 AI Strategy pipeline
Copy the same structure with:
- event: `ai_strategy/requested`
- Prisma model: `AiStrategyRun` (or your actual model name)
- generator: `generateAiStrategyContent(...)`
- pdf renderer: `renderAiStrategyPdf(...)`
- objectPath: `strategies/${userId}/${jobId}.pdf`

---

## 6) Error handling (update DB on failure)

Minimum requirement: when something fails, update job row:

- `status = failed`
- `stage = failed`
- `error = <message>`

Important:
- Use `NonRetriableError` for permanent failures (bad input, missing job) to stop retries.
- For transient failures (network), allow retries.

---

## 7) Return `pdfUrl` from status endpoints

Update:
- `GET /api/custom-course/[id]`
- `GET /api/ai-strategy/[id]`

Logic:
- If job is not `ready` → return current status
- If `ready`:
  - If bucket is public (`SUPABASE_PDF_BUCKET_PUBLIC=true`) → return public URL
  - Else → return signed URL (e.g. 1 hour)

### Public bucket (simple)
Use:
```ts
supabase.storage.from(bucket).getPublicUrl(path)
```

### Private bucket (recommended)
Use:
```ts
supabase.storage.from(bucket).createSignedUrl(path, 3600)
```

Return JSON like:
```json
{
  "jobId": "...",
  "status": "ready",
  "stage": "done",
  "progress": 100,
  "result": {
    "pdfPath": "...",
    "pdfBucket": "...",
    "pdfUrl": "https://..."
  }
}
```

---

## 8) Acceptance criteria (Step 4)

- [ ] Inngest run executes the pipeline and updates DB stages:
  - `in_queue → processing(generating) → rendering → uploading → ready`
- [ ] PDF is uploaded to Supabase Storage under a deterministic path:
  - `courses/<userId>/<jobId>.pdf`
- [ ] Status endpoint returns a valid PDF URL when ready (public or signed)
- [ ] On any failure, job is marked `failed` with `error` message
- [ ] No side-effects happen outside `step.run()`

---

## 9) Practical note: keep PDF small (2–3 pages)

- Use your compact prompt v2
- Avoid heavy images
- Keep page count deterministic by limiting sections/word count
- If Arabic is requested, generate Arabic directly (no need for “1:1” translation parity)

---

## 10) Next step (Step 5 preview)

- Add “Cancel job” (optional)
- Add token refund rules on failure (if not already)
- Add email notification on completion (optional)
