# Step 5 — Production readiness on Vercel (Hobby) + Inngest + Supabase

Goal: ship your background generation to **production** with predictable limits, reliable status updates, and safe downloads — without redesigning UI.

This step is **ops / wiring / validation**, not feature work.

---

## What you will validate in Step 5

- ✅ `/api/inngest` works in production (Vercel) and is reachable by Inngest
- ✅ Vercel function duration is configured correctly for Hobby (max 300s)
- ✅ No more `output_too_large` risks (step outputs stay tiny)
- ✅ Private PDF bucket downloads via **signed URLs**
- ✅ Multi-language = **2 jobs** = 2 independent PDFs (EN + AR)
- ✅ If anything fails, jobs end in `failed` (never “processing forever”)

---

## 0) Production preflight checklist (no code changes yet)

### 0.1 Confirm plan constraints
Vercel Hobby allows up to **300 seconds** max duration for Functions (configurable up to 300s).  
(Your code must stay within this envelope.)

### 0.2 Confirm buckets & paths (your canonical structure)
**PDFs (private)**
- bucket: `course-pdf`
- custom course folder: `custom/`
- ai strategy folder: `ai-strategy/`

**Images (public)**
- bucket: `course-images`
- covers folder: `covers/`
- diagrams folder: `diagrams/`
- leave `courses/` and `misc/` alone (don’t rely on them unless already used)

---

## 1) Vercel: function configuration (required)

### 1.1 Ensure `/api/inngest` is Node.js + maxDuration
In `/app/api/inngest/route.ts` set:

```ts
export const runtime = "nodejs";
export const maxDuration = 300;
```

> Hobby maxDuration cap is 300s. Do not set higher.

### 1.2 Avoid accidental caching for status endpoints
For status endpoints (the ones the UI polls), ensure responses are not cached:
- Either set `export const dynamic = "force-dynamic"` in the route handler file
- Or ensure you’re not using any caching primitives

(Keep it simple: add `dynamic = "force-dynamic"` if unsure.)

---

## 2) Inngest: serve endpoint requirements (App Router)

In Next.js App Router, your Inngest serve route must export:

```ts
export const { GET, POST, PUT } = serve({ client: inngest, functions });
```

✅ Confirm:
- `/api/inngest` exports **GET + POST + PUT**
- Production URL can be called by Inngest (see Deployment Protection below)

---

## 3) Vercel Deployment Protection (common production blocker)

If Vercel Deployment Protection is enabled, Inngest cannot reach `/api/inngest` and runs may fail/time out.

Action:
- Ensure `/api/inngest` is accessible from the public internet
- If you need protection, configure a bypass (Pro feature) or disable protection for the serve endpoint

---

## 4) Environment variables (production)

### 4.1 Required (Vercel Environment Variables)
**Inngest**
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

**Supabase**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

**Buckets**
- `SUPABASE_BUCKET_COURSE_PDF=course-pdf`
- `SUPABASE_BUCKET_COURSE_IMAGES=course-images`

> Do not add service role key to the client. Never expose it.

### 4.2 Recommended sanity checks
- In Vercel → Project → Settings → Environment Variables:
  - Confirm all keys exist in the correct environments (Production at minimum)
- Re-deploy after adding/changing env vars

---

## 5) Hard guardrails (to prevent `output_too_large` in prod)

Inngest limits:
- step output size: **4MB**
- total run state: **32MB**
Also, Vercel payload sizes are limited (~4–4.5MB depending on the path).

Rules:
1) Never return **PDF bytes**, **big JSON**, or **long strings** from any `step.run()`
2) Large outputs must be stored (DB or Storage) inside the step
3) Step returns should be tiny pointers: `{ pdf_url }`, `{ counts }`, `{ objectPath }`

✅ Verify in code:
- `pdf:render` does **not** return `Buffer` to Inngest state
- Prefer a combined step: `pdf:render-and-upload` which uploads and returns only `pdf_url`

---

## 6) Private PDF downloads via signed URLs

### 6.1 DB format (pointer only)
Store:
- `pdf_url = "supabase://course-pdf/custom/<filename>.pdf"`
or
- `pdf_url = "supabase://course-pdf/ai-strategy/<filename>.pdf"`

Do NOT store signed URLs in DB.

### 6.2 Status endpoint behavior
When job `status=ready`:
1) parse `pdf_url` into `{ bucket, path }`
2) create signed URL with TTL (e.g. 3600 seconds)
3) return it as `result.pdfUrl`

---

## 7) Multilang in production: EN + AR = 2 jobs

### 7.1 Start endpoint contract
If user selected `["en","ar"]`, your start endpoint must:
- create 2 jobs in DB
- send 2 Inngest events
- return:

```json
{
  "ok": true,
  "jobs": [
    { "jobId": 123, "language": "en" },
    { "jobId": 124, "language": "ar" }
  ]
}
```

### 7.2 Frontend (keep layout stable)
On the same page, display two rows:
- EN: status/progress/download
- AR: status/progress/download

No redesign — only a compact list.

---

## 8) Production smoke tests (do these after deploy)

### 8.1 `/api/inngest` health
- Open production `/api/inngest` in browser:
  - should respond (not 401, not blocked)
- In Inngest dashboard:
  - functions appear under the app

### 8.2 Custom Course: end-to-end
1) Trigger generation with EN+AR
2) Confirm API returns `jobs[]` with 2 jobIds
3) Confirm Inngest shows **two runs**
4) Confirm each job ends in `ready` and has `pdf_url` set
5) Confirm status endpoint returns a **signed URL**
6) Open signed URL in browser → PDF downloads

### 8.3 AI Strategy: end-to-end
Repeat the same flow for ai-strategy generation.

### 8.4 Negative test (failure ends in failed)
Intentionally break one input (e.g. invalid jobId event) and confirm:
- DB ends in `failed`
- `status_error` is populated
- UI shows failed state (no infinite spinner)

---

## Acceptance Criteria (Step 5 is done when…)

- [ ] Production `/api/inngest` is reachable by Inngest and shows functions
- [ ] Vercel maxDuration set to 300s (Hobby safe)
- [ ] No run stores big outputs; no `output_too_large`
- [ ] PDFs stored in `course-pdf/custom/` and `course-pdf/ai-strategy/`
- [ ] PDFs are downloadable via signed URL from status endpoint
- [ ] EN+AR creates 2 jobs and 2 PDFs
- [ ] Failures end in `failed` with error (no infinite `processing`)

---

## If something fails in prod (fast triage)

1) Inngest dashboard → open run → see last step + error
2) Vercel logs → filter by `/api/inngest` and the time of the run
3) If runs time out:
   - confirm `maxDuration=300`
   - reduce per-step work (especially PDF work)
4) If Inngest can’t reach endpoint:
   - check Deployment Protection
   - check route exports GET/POST/PUT
