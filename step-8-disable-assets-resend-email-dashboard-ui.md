# Step 8 — Simplify & Finish: disable Cover/Diagrams, add Resend email with download link, fix Dashboard AI Strategies, remove Progress UI

This step intentionally **does not change** the core pipelines that already work:
- `llm:generate` (keep as-is)
- `pdf:render-and-upload` (keep as-is)
- DB status transitions (`processing → ready/failed`) (keep as-is)

We only do:
A) Disable cover/diagram generation (to reduce load)
C) Email the PDF link via Resend (no attachment)
+ Fix: AI Strategies not shown on `/dashboard`
+ UI cleanup: remove progress bar on generation pages

---

## A) Disable cover/diagrams generation (ONLY this, keep everything else)

### A1) Remove/disable the assets enqueue step
In both pipelines:
- `generate-custom-course`
- `generate-ai-strategy`

Find the step that emits the assets event (e.g. `event:assets-request`, `custom_course/assets.requested`, `ai_strategy/assets.requested`) and **disable it**.

✅ Requirement: pipelines must still end with `db:set-ready` and store `pdf_url`.

### A2) Add a feature flag (recommended)
Add env var:
- `ENABLE_COURSE_IMAGES=false`

Wrap the assets enqueue logic:
- if `ENABLE_COURSE_IMAGES === "true"` → send assets event
- else → skip

This lets us re-enable later without refactoring.

### A3) Ensure UI uses placeholders
If UI was attempting to show cover/diagrams:
- keep placeholder images
- do not block rendering if cover_path/diagram_paths are null

**Acceptance (A):**
- In Inngest runs, there is **no** assets event step for both pipelines.
- No new files appear in Supabase `course-images/covers` or `course-images/diagrams`.

---

## C) Send PDF link via Resend (no attachments)

We will send **a link** (safe, small, deliverable), not the PDF file itself.

### C1) Preconditions (Resend)
- Resend domain must be **Verified** (SPF + DKIM).

### C2) Environment variables
Add to Vercel env:
- `RESEND_API_KEY=...`
- `RESEND_FROM="Avenqor <no-reply@YOURDOMAIN>"`
- `APP_BASE_URL="https://www.avenqor.net"`
- `DOWNLOAD_SIGNED_URL_TTL_SECONDS=600`  (10 minutes)
- `EMAIL_NOTIFICATIONS_ENABLED=true`

Also confirm:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET_COURSE_PDF=course-pdf` (or the existing bucket env you already use)

### C3) Implement a “download redirect” route handler
Create a route handler that:
1) Requires user auth/session (same as dashboard)
2) Loads job by jobId + userId
3) Confirms `status === "ready"` and `pdf_url` exists
4) Parses `pdf_url` which is in format:  
   `supabase://course-pdf/<folder>/<filename>.pdf`
5) Generates a signed URL using Supabase Storage:
   - `createSignedUrl(path, ttlSeconds)`
6) Redirects the browser to the signed URL (302)

Suggested route:
- `/app/api/download/[type]/[jobId]/route.ts`
  - `type` in: `custom` | `ai-strategy`

Behavior:
- If unauthenticated → redirect to `/auth/login?next=<download-url>`
- If job not found or not owned by user → 404
- If not ready → 409 (or redirect back to dashboard with message)

### C4) Send email after `db:set-ready`
In each pipeline (custom + ai-strategy), **after** `db:set-ready`:
- If `EMAIL_NOTIFICATIONS_ENABLED === "true"`:
  - call Resend `emails.send(...)`
  - email contains a CTA link to:
    - `${APP_BASE_URL}/api/download/<type>/<jobId>`

Email content:
- Subject:
  - `Your PDF is ready — <Course/Strategy title>`
- HTML body:
  - short text + button link
  - include fallback raw link

Store email result in DB (recommended minimal fields):
- `email_status: "sent" | "failed"`
- `email_sent_at`
- `email_error` (nullable)
- `email_message_id` (optional)

**Important:**
- Do not attach the PDF.
- Do not generate signed URL at email-send time (it will expire). Only generate signed URL **when the user clicks the link**.

**Acceptance (C):**
- After a job reaches `ready`, an email is sent via Resend.
- Clicking the link while logged in downloads the PDF.
- If logged out, user is redirected to login and then can download.

---

## Fix: AI Strategies not showing on `/dashboard` (“Your courses & strategies” table)

### D1) Locate data source for the dashboard table
Find the exact server function / API route that powers:
- `/dashboard` → table “Your courses & strategies”

### D2) Ensure AI Strategies query is included
Common issue: the table fetch only includes custom courses.

Required behavior:
- Fetch **both**:
  - Custom Course jobs
  - AI Strategy jobs
- Merge into a unified list sorted by `createdAt desc` (or `requestedAt desc`)
- Include statuses: `processing | ready | failed`

Implementation idea:
- `const [courses, strategies] = await Promise.all([...])`
- map both to a unified row type with `kind: "custom" | "ai-strategy"`
- render in one table

### D3) Verify userId consistency
Ensure the list query filters by the same `userId` that was stored in job rows by the pipeline.

### D4) Disable caching for dashboard data (user-specific)
On the dashboard pages (or their server data function), ensure user-specific content is not cached:
- `export const dynamic = "force-dynamic"`
- Any fetch calls should use `cache: "no-store"` if applicable.

**Acceptance (Dashboard):**
- After generating an AI Strategy, it appears on `/dashboard`.

---

## UI cleanup: remove progress bar on generation pages

We keep polling & statuses, but remove the progress bar UI.

### E1) Pages
Identify generation pages for:
- Custom Courses generation
- AI Strategy generation

### E2) Remove the progress bar component
- Remove/hide the visual progress bar
- Keep a simple status indicator:
  - spinner + text: `Generating…`
  - on ready: `Ready` + download button
  - on failed: error text + retry CTA

Do not change backend progress tracking; only remove the UI widget.

**Acceptance (UI):**
- No progress bar visible anywhere
- Generation still works; statuses update; download works

---

## Test plan (manual)

1) Custom Course:
- Create 1 job → confirm Inngest run ends `ready`
- Confirm no assets event step
- Confirm email is sent
- Confirm dashboard shows the custom course row
- Confirm download link works

2) AI Strategy:
- Create 1 job → confirm `ready`
- Confirm email is sent
- Confirm `/dashboard` shows AI strategy row
- Confirm download works

3) Auth:
- Open email link in an incognito browser → should redirect to login; after login, download should work.

---

## Notes / References (for implementation)
Resend:
- Send emails with Node.js SDK
- Domains: SPF/DKIM verification

Supabase:
- Storage `createSignedUrl(...)`

Next.js:
- Route Handlers and `NextResponse.redirect(...)`
