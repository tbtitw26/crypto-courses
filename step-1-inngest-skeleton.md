# Step 1 — Add Inngest “skeleton” to the Next.js (App Router) project

This step only sets up **durable background execution infrastructure** (Inngest) and a **test function**.
Actual course generation + PDF rendering + Supabase upload will be implemented in later steps.

## What this step delivers

- ✅ Inngest SDK installed
- ✅ `/api/inngest` route serving functions via `serve()`
- ✅ Inngest client (`src/inngest/client.ts`)
- ✅ First test function (`test/hello.world`)
- ✅ One test API route that sends an event from your app (`/api/hello`)
- ✅ Local Dev Server workflow (run, trigger, verify)
- ✅ Production env vars checklist for Vercel

---

## 0) Prerequisites

- Next.js project uses **App Router** (you have `src/app/...`)
- Node.js 20+ recommended
- App runs locally (`npm run dev`)

---

## 1) Install Inngest SDK

From the project root:

```bash
npm install inngest
```

---

## 2) Run the Inngest Dev Server (local)

Open a **second terminal** and run:

```bash
npx inngest-cli@latest dev
```

- Dev Server UI: http://localhost:8288  
- It will autodiscover your `/api/inngest` endpoint once you add it.

> Tip: keep this running while developing. It shows functions + runs.

---

## 3) Create the Inngest client

Create:

**`src/inngest/client.ts`**
```ts
import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "avenqor" });
```

Notes:
- The `id` should be stable (use your product/app name).
- Do not include secrets here.

---

## 4) Create your first Inngest function

Create:

**`src/inngest/functions.ts`**
```ts
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);
```

---

## 5) Serve functions from `/api/inngest`

Create:

**`src/app/api/inngest/route.ts`**
```ts
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld } from "../../../inngest/functions";

// Ensure Node runtime (recommended for Inngest on Vercel)
export const runtime = "nodejs";

// Serve Inngest functions over HTTP at /api/inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld],
});
```

Important:
- Keep this route exactly at **`/api/inngest`** for easiest deploy + discovery.

---

## 6) Add a test API route to send an event from your app

Create:

**`src/app/api/hello/route.ts`**
```ts
import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await inngest.send({
    name: "test/hello.world",
    data: { email: "test@example.com" },
  });

  return NextResponse.json({ ok: true });
}
```

---

## 7) Verify locally (must pass)

### A) Verify the function is discovered
1. Start Next.js: `npm run dev`
2. Start Dev Server: `npx inngest-cli@latest dev`
3. Open http://localhost:8288 → **Functions** tab  
   You should see: `hello-world`

If not:
- Ensure `/api/inngest` exists and the app is running
- Check the Dev Server “Apps” tab for discovery errors

### B) Trigger from Dev Server UI
- In Functions → `hello-world` → **Invoke**
- Payload:
```json
{
  "data": { "email": "test@example.com" }
}
```
- Check “Runs” tab → run should complete

### C) Trigger from your app (HTTP)
```bash
curl -X POST http://localhost:3000/api/hello
```
- Expect: `{"ok":true}`
- Dev Server should show a new run

---

## 8) Production setup (Vercel)

For **Inngest Cloud** (production), set these env vars in **Vercel Project → Settings → Environment Variables**:

- `INNGEST_EVENT_KEY`  (from Inngest dashboard)
- `INNGEST_SIGNING_KEY` (from Inngest dashboard)

Optional but recommended:
- `INNGEST_SIGNING_KEY_FALLBACK` (for key rotation)
- `INNGEST_LOG_LEVEL=info`

> In local dev with Dev Server, keys are typically not required, but production requires them.

---

## 9) Acceptance criteria for Step 1

- [ ] `/api/inngest` exists and serves at least 1 function
- [ ] Inngest Dev Server (8288) shows the function in “Functions”
- [ ] Invoking from UI creates a successful run
- [ ] `POST /api/hello` sends the event and creates a successful run
- [ ] No Edge runtime used for Inngest routes (Node.js only)

---

## 10) What’s next (Step 2 preview)

Next we will:
- Make your existing `POST /api/custom-course` and `POST /api/ai-strategy` endpoints **thin starters**
- They will create a DB job row (Neon) and send an Inngest event
- No generation happens inside the HTTP request anymore

PDF storage note:
- Generated PDFs will be uploaded to **Supabase Storage** (bucket) in **Step 4** (worker pipeline).
- Step 1 only installs the background job engine (Inngest) and a test function.
