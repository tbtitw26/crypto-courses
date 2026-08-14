# Avenqor – Trading Education & AI Workbench

Avenqor is a bilingual (English + Modern Standard Arabic) education platform for retail traders.  
It combines curated PDF courses, trader-tailored custom PDFs, and AI-generated strategies powered by OpenAI (GPT-5/GPT-4o class models) with a secure token-based billing system.

## 🚀 Highlights

- **AI & Custom Generation** – Structured custom courses and AI strategies (PDF + diagrams) delivered via email and dashboard.
- **Token Economy** – Users top up GBP-based packs (with automatic EUR/USD conversion) and spend tokens on courses/AI/services.
- **Multi-Currency & i18n** – GBP/EUR/USD display + locale-aware PDFs (English or Arabic).
- **Checkout & Billing** – Card-only payments (Visa/Mastercard), receipts & invoices (Puppeteer PDFs), dashboard analytics, transactions, receipts download.
- **Authentication & Security** – NextAuth (credentials + Google), password reset via email, localized email templates, structured logging.
- **Content Library** – Ready-made courses, `/learn` knowledge base pages, `/resources` hub, and dashboard library with downloads.
- **Modern UX** – Next.js App Router, Tailwind + Framer Motion animations, responsive layout, dashboard navigation, embedded testimonial videos.

## 🛠 Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling & UI | Tailwind CSS, Framer Motion, Lucide Icons |
| State/Forms | React Hook Form + Zod, Zustand (cart), Toast hooks |
| Database | PostgreSQL (Neon), Prisma ORM with retry logic |
| Auth | NextAuth.js (credentials + Google OAuth) |
| AI & PDFs | OpenAI SDK, Puppeteer Core + @sparticuz/chromium |
| Email | Nodemailer (SMTP) |
| i18n | next-intl (en + ar) |
| Deployment | Vercel (serverless-friendly) |

## 📋 Prerequisites

- Node.js ≥ 18
- PostgreSQL instance (Neon recommended)
- npm (shipped) or yarn/pnpm
- OpenAI API access + SMTP credentials + Google OAuth keys

## ⚙️ Setup

### 1. Clone & install
```bash
git clone <repo-url>
cd forex_crypto
npm install
```

### 2. Environment variables
Copy `.env.example` → `.env.local` and fill in:

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon/Postgres URL (`?pgbouncer=true&sslmode=require`) |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth config |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `OPENAI_API_KEY`, optional org ID | AI generation |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Nodemailer |
| `TOKEN_BASE_CURRENCY`, pricing multipliers | Token logic |
| Any extra keys referenced in `lib/config.ts` or docs |

> Keep `.env.local` out of git. Update `.env.example` when new secrets appear.

### 3. Database
```bash
npm run db:generate        # prisma generate
npm run db:migrate:deploy  # apply migrations
# optional seeds
npm run db:seed
```

### 4. Dev & QA
```bash
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck  # tsc --noEmit
npm run build      # runs `prebuild` (rimraf .next) + next build
```

For production deploys, follow `docs/vercel-build-plan.md` (envs, build steps, smoke tests).

## 🗂 Project Structure (excerpt)
```
├── app/
│   ├── api/…              # REST endpoints (auth, courses, billing, AI, etc.)
│   ├── dashboard/…        # Dashboard routes (settings, receipts, ai-strategies…)
│   ├── learn/, resources/ # Public content pages
│   └── …                  # Contact, pricing, terms, privacy, etc.
├── components/            # UI blocks (Header, BillingPage, Course cards…)
├── lib/                   # prisma.ts, currency utils, AI pricing, email helpers
├── prisma/                # schema + migrations + seed
├── public/                # static assets: PDFs, videos, logos
├── scripts/               # tooling (course pricing, PDF generation helpers)
├── docs/                  # cleanup checklist, Vercel build plan, specs
└── README.md              # you are here
```

## 🔐 Security & Compliance
- Secrets only in env variables (never hard-coded).
- Passwords hashed (bcrypt); reset via signed tokens + email.
- Billing: card payments only, tokens deducted for services; receipts PDF’d + emailed.
- Education-only posture enforced in UI copy, emails, legal docs.

## 📝 License & Contact
- Proprietary © 2025 OVERSEAS SUPPORT LIMITED (Avenqor). All rights reserved.
- Support: `info@avenqor.net`
- For deployment/runbooks see `DEPLOYMENT.md`, `VERCEL_DEPLOY.md`, and `docs/`.
