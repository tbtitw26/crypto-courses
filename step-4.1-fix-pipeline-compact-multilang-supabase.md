# Step 4.1 — Fix stuck Inngest runs + enforce 2–3 pages + 2 jobs (EN+AR) + correct Supabase paths

Goal: make generation **reliable on Vercel**, always finish with `ready|failed`, produce **max 2–3 pages**, and when user selects EN+AR — create **two separate jobs** and generate **two PDFs**.

This step updates both pipelines:
- Custom Course (PDF bucket path: `course-pdf/custom/…`)
- AI Strategy (PDF bucket path: `course-pdf/ai-strategy/…`)

Images stay in **public** bucket `course-images/`:
- `covers/`
- `diagrams/`
- (`courses/`, `misc/` — keep as-is; don’t depend on them unless already used)

Supabase structure (confirmed):
- Custom Course PDFs: `course-pdf/custom/`
- AI Strategy PDFs: `course-pdf/ai-strategy/`
- Images (public): `course-images/covers/`, `course-images/diagrams/`, etc.

---

## 0) Non‑negotiables (Inngest correctness)

### 0.1 Serve route requirements
Ensure `/app/api/inngest/route.ts` uses Node runtime and exports GET/POST/PUT via `serve()` (App Router requirement).

Also set:
```ts
export const runtime = "nodejs";
export const maxDuration = 300;
```

### 0.2 All side effects must be inside steps
Anything that can fail / take time must be inside `step.run()` (or `step.fetch()` for network).
Use stable step IDs (they are memoized and retried individually).

### 0.3 Error handling must update DB
Wrap the function body in `try/catch`. On any error:
- set DB status to `failed`
- store `status_error`
- set `status_stage = "failed"` and progress (e.g. 100)

Use `NonRetriableError` for permanent problems (job missing, invalid input) to stop retries.

---

## 1) Fix the “stuck at 5% / only 2 steps visible” issue

### 1.1 Add trace “breadcrumbs” as steps
Immediately after `db:set-processing`, add cheap `step.run()` markers so we can see where it stops:
- `trace:before-llm`
- `trace:after-llm`
- `trace:before-pdf`
- `trace:after-pdf`
- `trace:before-upload`
- `trace:after-upload`

Each marker can just update DB `status_message` or insert a log row.

### 1.2 Break the pipeline into explicit steps (minimum set)
Replace any “mega function” call that hides work (example: `generateCustomCourseComplete()`) with explicit steps.

For Custom Course:
1. `db:load-job`
2. `db:set-processing` (stage=`generating`, progress=5)
3. `llm:generate` (content only)
4. `db:store-content` (store structured JSON if you already do it)
5. `pdf:render` (NO images initially!)
6. `storage:upload-pdf`
7. `db:set-ready`

Do the same for AI Strategy.

**Important:** do NOT generate cover/diagrams in this phase unless it’s already stable and fast. Re-enable after the core pipeline is stable.

---

## 2) Enforce 2–3 pages (hard limit)

The current schema allows too much content. We need a compact schema + a code-level clamp.

### 2.1 Add COMPACT schemas
Create:
- `COMPACT_CUSTOM_COURSE_JSON_SCHEMA`
- `COMPACT_AI_STRATEGY_JSON_SCHEMA`

Hard limits example:
- modules: 1
- lessons per module: 1–2
- content blocks per lesson: 1
- glossary: 0–4
- quiz: 0–3
- diagrams: 0

### 2.2 Add post‑LLM “clamp” (final safety)
Even if the model returns too much, clamp it in code before PDF render:
```ts
course.modules = course.modules.slice(0, 1);
course.modules[0].lessons = course.modules[0].lessons.slice(0, 2);
// clamp glossary/quiz/etc
```

### 2.3 PDF renderer guard
If renderer receives more than allowed, truncate content and render only the compact subset.
This guarantees max pages regardless of LLM drift.

---

## 3) Supabase storage: correct buckets + correct paths

### 3.1 Buckets
Use existing envs (do not introduce new names unless missing):
- PDF bucket env: `SUPABASE_BUCKET_COURSE_PDF` → `course-pdf` (private)
- Images bucket env: `SUPABASE_BUCKET_COURSE_IMAGES` → `course-images` (public)

Keep `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` server-only.

### 3.2 PDF object key rule (prevent overwrites)
Your current file example is:
`course-pdf/custom/basic-trading-course-for-day-trading-en.pdf`

This can overwrite if a user generates the same course twice. Fix by adding `jobId`:

**Custom Course**
- key: `custom/${courseId}-${lang}-${jobId}.pdf`

**AI Strategy**
- key: `ai-strategy/${courseId}-${lang}-${jobId}.pdf`

### 3.3 Store in DB as supabase URI
Keep the existing single-field format:
- `pdf_url = "supabase://course-pdf/custom/<filename>.pdf"`
(or `supabase://course-pdf/ai-strategy/<filename>.pdf`)

Do NOT store signed URLs in DB (they expire).

---

## 4) Signed download URLs (private bucket)

In your status endpoint:
- if job is `ready` and `pdf_url` exists:
  - parse `supabase://bucket/path`
  - return a **signed URL** generated server-side with TTL 3600

---

## 5) Multi-language requirement: EN+AR = two jobs, two PDFs

Confirmed behavior: if user chooses EN+AR → create 2 jobs and generate 2 PDFs.

### 5.1 API start endpoint changes (Custom Course + AI Strategy)
If `languages` contains more than 1 language:
1) create **one DB job per language** (`language` field set to that language)
2) send **one Inngest event per job** (can be batch send)
3) return:
```json
{ "ok": true, "jobs": [{ "jobId": 9, "language": "en" }, { "jobId": 10, "language": "ar" }] }
```

### 5.2 Worker input
Each worker run should receive exactly one language, not an array.

In Step 4.1 do NOT do “translate EN → AR”.
Instead:
- EN job: generate directly in English
- AR job: generate directly in Arabic

(Translation can be reintroduced later if you need 1:1 parity.)

---

## 6) Frontend follow-up (small, no redesign)

After backend returns `jobs[]`, update the page logic:
- store `jobs[]` in state
- poll status for each job
- show two lines (EN + AR) with progress and download button when ready

Keep layout stable: do not redesign, just add a compact list.

---

## Acceptance Criteria

### Reliability
- [ ] Inngest run shows **all steps** (llm, pdf, upload, ready/failed)
- [ ] Job never stays at 5% forever: ends in `ready` or `failed` with `status_error`

### Size
- [ ] Generated PDFs are **2–3 pages** (hard-limited)

### Storage
- [ ] Custom PDFs go to: `course-pdf/custom/`
- [ ] Strategy PDFs go to: `course-pdf/ai-strategy/`
- [ ] `pdf_url` in DB is `supabase://course-pdf/...`

### Multilang
- [ ] Choosing EN+AR creates **2 jobs** and produces **2 PDFs**
- [ ] API returns `jobs[]` with jobIds and languages

---

## Quick debug checklist if it still hangs
- Open the Inngest run details and check the step where it stops.
- Check Next.js server logs for thrown errors.
- Ensure no long-running work happens outside `step.run()`.
- Confirm Vercel route uses Node runtime and `maxDuration`.
