# Environment Variables (production / Vercel)

## Core
- `NODE_ENV=production`
- `DATABASE_URL` – PostgreSQL (Neon)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` – `https://your-domain`
- `SITE_BASE_URL` – `https://your-domain`

## OpenAI
- `OPENAI_API_KEY`
- `OPENAI_STRATEGY_MODEL` (default `gpt-4o-mini`)
- `OPENAI_COURSE_MODEL` (default `gpt-4o`)
- `OPENAI_CUSTOM_COURSE_MODEL` (default `gpt-4.1-mini`)
- `OPENAI_IMAGE_MODEL` (default `gpt-image-1-mini`)

## Supabase
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose to client)
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `USE_SUPABASE_STORAGE=true`
- `SUPABASE_BUCKET_COURSE_PDF=course-pdf` (private bucket for PDFs)
- `SUPABASE_BUCKET_COURSE_IMAGES=course-images` (public bucket for images)
- `SUPABASE_BUCKET_COURSE_MEDIA=course-media`
- `SUPABASE_SIGNED_URL_TTL_PDF=3600` (1 hour, recommended for security)

## Inngest (Background Job Processing)
- `INNGEST_EVENT_KEY` (required for sending events to Inngest)
- `INNGEST_SIGNING_KEY` (required for Inngest to verify requests to `/api/inngest`)
- `JOB_TIMEOUT_MINUTES=20` (watchdog: fail processing jobs older than this)

## Browserless (PDF в serverless)
- `BROWSERLESS_API_KEY`
- `BROWSERLESS_ENDPOINT=wss://chrome.browserless.io`

## SMTP / Email
- `SMTP_HOST`
- `SMTP_PORT` (465)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_FROM_NAME`

## TransferMit (если не используется – можно не задавать)
- `TM_API_URL=https://app.transfermit.com/api/v1`
- `TM_API_KEY`
- `TM_SIGNING_KEY`

