# Step 2 — Make generation endpoints “thin starters” + add single-job status endpoints (Neon + Inngest)

This step converts your existing HTTP endpoints so they **never** run long generation work inside the request.
Instead, they:
1) validate input  
2) create a **job row** in Neon (via Prisma) with `status = in_queue`  
3) send an **Inngest event**  
4) return `jobId` immediately

Inngest will invoke your function over HTTP via `/api/inngest`, which is the recommended integration pattern for Next.js App Router. (App Router requires GET/POST/PUT on the Inngest handler.) citeturn0search10turn0search3  
Events are sent using `inngest.send(...)`. citeturn0search0turn0search3  
We will later build the full durable workflow with steps and retries in Step 4. citeturn0search2turn0search12

---

## Scope boundaries (important)

✅ In scope:
- Update “start” endpoints to enqueue jobs instead of generating
- Add **single-job status** endpoints for polling
- Add a **placeholder Inngest worker** that updates status (to prove wiring end-to-end)

❌ Out of scope (later steps):
- Full course/strategy generation pipeline
- PDF rendering + Supabase upload
- Token charging/refunds logic

---

## 0) Repository assumptions

- App Router is in project root: `/app/...`
- Inngest skeleton from Step 1 exists:
  - `/inngest/client.ts`
  - `/inngest/functions.ts`
  - `/app/api/inngest/route.ts`

---

## 1) Identify the existing generation endpoints (DO NOT rename them)

**Task:** Find what the frontend calls today.
- Search for `fetch("/api/` and locate routes for:
  - custom course generation start
  - AI strategy generation start
- Keep the same paths to avoid breaking UI.

Deliverable:
- List the exact route files to be changed (paths), and where they are called from the UI.

---

## 2) Confirm the job tables / Prisma models

**Task:** Locate Prisma models used today for:
- Custom Course requests (e.g., `CustomCourseRequest`)
- AI Strategy requests (whatever the model is)

Deliverable:
- Model names + required fields

**Required fields for Step 2 (minimum):**
- `id` (jobId)
- `status` (string/enum) with at least: `in_queue`, `processing`, `ready`, `failed`  
  (If your project already uses different names, reuse them and provide a mapping.)
- `createdAt`, `updatedAt`
- Optional now but recommended: `error` (string), `stage` (string), `progress` (number)

If status field does not exist, add it via Prisma migration.

---

## 3) Define event names and payloads (stable contract)

Use two events (clear + separable):

- `custom_course/requested`
- `ai_strategy/requested`

Payload must include:
- `jobId` (string)
- `userId` (string) if available at enqueue time
- `language` ("en" | "ar")
- `requestedAt` (ISO string)

Deliverable:
- A small TypeScript type for each event payload (optional but recommended)

---

## 4) Update the “start” endpoints to enqueue

For each start endpoint:

### 4.1 Validate & auth
- Keep existing auth checks exactly as-is.
- Keep existing input validation.

### 4.2 Create job row
Create a new job row in Neon with:
- status = `in_queue`
- stage = `queued` (optional)
- store the user input fields you already store today (do not change schema unless necessary)

### 4.3 Send Inngest event
Use `inngest.send(...)` to enqueue the event. citeturn0search0turn0search3

If sending fails:
- update job row to `failed`
- store error message
- return HTTP 500

### 4.4 Response
Return immediately:
```json
{ "ok": true, "jobId": "<id>" }
```

**Do not** run any generation work in this HTTP request.

---

## 5) Add single-job status endpoints (polling-friendly)

Add for each job type:

- `GET /api/custom-course/[id]`
- `GET /api/ai-strategy/[id]`

Response should include (minimum):
```json
{
  "jobId": "...",
  "status": "in_queue|processing|ready|failed",
  "stage": "queued|generating|rendering|uploading|done",
  "progress": 0,
  "error": null,
  "result": null
}
```

Notes:
- You can keep `result=null` until Step 4 (where PDF url will be added).
- Include `updatedAt` to help UI show freshness.

---

## 6) Add placeholder Inngest workers (end-to-end proof)

In `/inngest/functions.ts` add two functions:

- Function A:
  - trigger: `custom_course/requested`
  - behavior:
    1) set job.status = `processing`
    2) `step.sleep("simulate-work", "2s")`
    3) set job.status = `ready` (or `completed`) and stage = `done`
    4) return payload

- Function B:
  - same for `ai_strategy/requested`

Use `step.run(...)` for DB updates where appropriate, and `step.sleep(...)` to simulate work. Steps are the recommended way to build durable workflows. citeturn0search2turn0search12

Important:
- This placeholder is temporary; in Step 4 we replace the simulated work with the real pipeline.

---

## 7) Ensure Node.js runtime for the modified API routes

For every modified route file, add:
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

This avoids accidental Edge execution and caching in dev/prod.

---

## 8) Verification checklist (must pass)

1) Start endpoints return quickly (< 500ms locally):
- `POST /api/custom-course` → `{ ok: true, jobId }`
- `POST /api/ai-strategy` → `{ ok: true, jobId }`

2) Inngest Dev Server shows runs:
- triggers `custom_course/requested` and/or `ai_strategy/requested`

3) DB status transitions happen:
- `in_queue` → `processing` → `ready`

4) Status endpoints show live status:
- `GET /api/custom-course/<jobId>`
- `GET /api/ai-strategy/<jobId>`

---

## 9) What Step 3 will do (preview)

- Update the frontend to:
  - store `jobId`
  - poll the new status endpoints
  - show progress/stage reliably even if the user navigates away
