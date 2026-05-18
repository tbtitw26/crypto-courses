# PROMPT.md — Full Website Redesign Plan

## 1. Mission

Avenqor needs a full-site visual redesign while preserving all existing functionality, routes, data flows, API contracts, authentication, token billing, checkout, PDF/download logic, dashboard behavior, i18n/RTL support, and educational-risk posture.

The existing website is a functional reference, not a visual constraint. The redesigned site must feel like a new premium fintech education product for retail traders, with stronger page structures, clearer conversion paths, more useful dashboards, better form ergonomics, and more polished responsive layouts. This is not a light restyle.

## 2. Non-Negotiable Rules

- Preserve every existing page route listed in this document.
- Preserve all API route contracts unless a real bug is intentionally fixed and documented.
- Preserve NextAuth session behavior, credentials auth, password reset, server-side protected-route redirects, and profile/password update flows.
- Preserve token balance logic, token pricing formulas, cart behavior, token top-up checkout, hosted payment redirect, payment status polling, course purchase, receipts, and PDF download links.
- Preserve custom course and AI strategy generation request logic, token checks, token deductions, Inngest enqueue flow, status endpoints, and dashboard download behavior.
- Preserve existing data flow from Prisma, static course fallback, cookies, localStorage, Supabase URL resolution, and i18n message files.
- Preserve dynamic values. Do not replace live balances, course data, transactions, statuses, localized copy, prices, PDFs, or downloads with hardcoded content.
- Preserve the existing i18n infrastructure, including locale cookies, `html.lang`, `html.dir`, and existing Arabic files, but do not actively translate, rewrite, or redesign Arabic content during this English-only redesign pass.
- Preserve GBP/EUR/USD/SR display behavior and `user_currency` cookie reload behavior.
- Preserve legal, risk, education-only, cookie-consent, payment, and refund content.
- Do not delete working features
- Do not simplify the product into a static brochure.
- Do not make only cosmetic edits such as color, font, radius, shadow, or button tweaks.
- Do not leave the same layout with new colors.
- Do not remove the cart or dashboard from header/mobile navigation.
- Do not fake testimonials, fake backend responses, fake receipts, fake token balances, fake generation results, or fake payment states.
- Do not change environment variable names, payment provider secrets, OpenAI model config, Supabase settings, SMTP settings, or Inngest settings as part of visual redesign.
- Do not edit API/backend logic unless the implementation phase explicitly identifies a blocking UI integration bug.
- Do not regress accessibility, keyboard navigation, focus visibility, contrast, or readable mobile layouts.

## English-Only Redesign Scope

For this redesign implementation, work on the English UI only.

Do not translate content into Arabic.
Do not rewrite Arabic translation files.
Do not improve Arabic copy.
Do not spend time redesigning Arabic-specific content pages.
Do not perform Arabic content QA unless required to avoid breaking the app.
Do not create new Arabic translations for newly redesigned UI unless the code requires existing translation keys to remain valid.

Important:
- Preserve the existing Arabic/i18n infrastructure so the app does not break.
- Do not delete Arabic translation files.
- Do not delete RTL support.
- Do not remove locale switching logic.
- Do not remove `html.lang` or `html.dir` handling.
- Do not break existing Arabic routes/copy if they already work.
- If a component already uses translation keys, preserve the key structure or update English and Arabic only minimally to prevent runtime errors.

The goal is:
- redesign and polish the English version first
- avoid spending unnecessary time/tokens on Arabic translation work
- keep Arabic support technically intact but visually/content-wise out of scope for this redesign pass

If Arabic-specific issues are discovered, document them as follow-up work instead of solving them now.

## 3. Current Project Analysis

### Product Description From README

Avenqor is a bilingual English + Modern Standard Arabic trading education platform for retail traders. It combines curated PDF courses, trader-tailored custom PDFs, AI-generated strategies powered by OpenAI, and secure token-based billing.

Core product pillars from `README.md`:

- Curated PDF courses for Forex, Crypto, Binary options, general trading foundations, risk, psychology, journaling, and trading process.
- Custom course generation: users submit a trading profile and receive tailored PDFs and diagrams.
- AI strategy generation: users generate strategy PDFs from their profile, markets, timeframe, risk, instruments, detail level, and language selection.
- Token economy: users top up GBP-based packs, see automatic EUR/USD/SR conversion, and spend tokens on courses and generation services.
- Multi-currency and i18n: GBP, EUR, USD, Saudi Riyal display plus English/Arabic locale-aware PDFs.
- Checkout and billing: card-only payment posture in README, hosted checkout in code, PDF receipts/invoices, dashboard transactions, receipts download.
- Authentication and security: NextAuth credentials + Google provider, password reset by email, localized email templates, bcrypt passwords, signed reset tokens.
- Content library: ready-made courses, `/learn` knowledge pages, `/resources`, dashboard library downloads.
- Education-only compliance posture across UI, email, and legal pages.

### Setup, Build, and Dev Commands From README and package.json

- `npm install`
- `npm run dev` - Next dev server, normally `http://localhost:3000`
- `npm run lint`
- `npm run typecheck` - `tsc --noEmit`
- `npm run build` - runs `prebuild` (`rimraf .next`) then `next build`
- `npm run start`
- `npm run clean`
- `npm run db:generate` - Prisma generate
- `npm run db:migrate:deploy` - production migration deploy
- `npm run db:migrate` - local Prisma migrate dev
- `npm run db:push`
- `npm run db:studio`
- `npm run db:seed`
- `npm run check-env`
- Course generation/admin scripts: `npm run generate-course`, `npm run generate-course:status`, `npm run generate-5-courses`, `npm run generate-pdf-only`, `npm run check-course-status`, `npm run custom-course:status`, `npm run ai-strategy:status`, `npm run monitor:generation`, `npm run migrate:assets`, `npm run migration:check`, `npm run courses:assets:update`.

Nested README-like file found at `lib/pdf/README.md` documents the PDF course generation system in Russian:

- `npm run generate-course <path-to-json-file>`
- `npm run generate-course:status`
- Status file: `public/courses/.generation-status.json`
- Logs: `logs/course-generation.log`
- Temp files: `public/courses/temp/`
- Generation stages: English course, cover, diagrams, Arabic translation, English PDF, Arabic PDF, completed.
- Requires Chrome/Chromium or `CHROME_PATH` for local PDF issues.
- Uses OpenAI text and image models configured in `lib/config.ts`.

### Environment Variable Notes

README mentions:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- optional OpenAI org ID
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- token base currency / pricing multipliers
- extra keys referenced in `lib/config.ts` and docs

`docs/env.example.md` and `lib/config.ts` also show:

- `SITE_BASE_URL`
- `OPENAI_STRATEGY_MODEL`, default `gpt-4o-mini`
- `OPENAI_COURSE_MODEL`, default `gpt-4o`
- `OPENAI_CUSTOM_COURSE_MODEL`, default `gpt-4.1-mini`
- `OPENAI_IMAGE_MODEL`, default `gpt-image-1-mini`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
- `USE_SUPABASE_STORAGE`
- `SUPABASE_BUCKET_COURSE_PDF`, `SUPABASE_BUCKET_COURSE_IMAGES`, `SUPABASE_BUCKET_COURSE_MEDIA`
- `SUPABASE_SIGNED_URL_TTL_PDF`
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `JOB_TIMEOUT_MINUTES`
- `BROWSERLESS_API_KEY`, `BROWSERLESS_ENDPOINT`
- `RESEND_API_KEY`, `RESEND_FROM`, `APP_BASE_URL`, `DOWNLOAD_SIGNED_URL_TTL_SECONDS`, `EMAIL_NOTIFICATIONS_ENABLED`
- `ENABLE_COURSE_IMAGES`
- `ARMENOTECH_API_URL`, `ARMENOTECH_MERCHANT_GUID`, `ARMENOTECH_APP_TOKEN`, `ARMENOTECH_APP_SECRET`, `ARMENOTECH_CALLBACK_SECRET`, `ARMENOTECH_METHOD_GUID_USD`, `ARMENOTECH_METHOD_GUID_EUR`, `ARMENOTECH_INIT_PATH_TEMPLATE`
- Legacy/optional TransferMit vars: `TM_API_URL`, `TM_API_KEY`, `TM_SIGNING_KEY`

Implementation warning: do not expose server-only Supabase service role keys, payment secrets, OpenAI keys, SMTP credentials, Inngest signing keys, or NextAuth secret in client code.

### Tech Stack

- Framework: Next.js 14 App Router, React 18, TypeScript.
- Routing: filesystem routes under `app/`, including API routes under `app/api`.
- Styling: Tailwind CSS with global component classes in `app/globals.css`; custom theme in `tailwind.config.js`.
- Fonts: `Inter` and `Space_Grotesk` loaded in `app/layout.tsx`.
- Animation: Framer Motion used heavily in page sections, cards, modals, banners, and hover states.
- Icons: Lucide React.
- Forms and validation: React Hook Form + Zod for forgot/reset/contact/change-password forms; local state validation in login/register/learn/checkout/top-up.
- Auth: NextAuth v4 with Prisma Adapter, credentials provider, Google provider configured server-side, bcryptjs, JWT sessions.
- State: React Context cart in `contexts/CartContext.tsx`; Zustand dependency exists but cart is not using Zustand.
- i18n: next-intl with manual cookie-based locale loading in `app/providers.tsx`; English messages statically imported, Arabic messages dynamically imported.
- Locale direction: `app/locale-provider.tsx` sets `html.lang` and `html.dir`.
- Database: PostgreSQL/Neon through Prisma with retry helper.
- AI/background: OpenAI SDK, Inngest background events, generation logs.
- PDFs/storage/email: Puppeteer Core, `@sparticuz/chromium`, Browserless for serverless Chrome, Supabase storage, Nodemailer, Resend.
- Payments: Hosted card deposit flow through Armenotech/APS code path, with legacy TransferMit naming in schema/config.

### Project Structure

- `app/` - Next App Router pages and API routes.
- `app/layout.tsx` - root metadata, fonts, `Header`, `Footer`, `LocaleProvider`, `Providers`.
- `app/providers.tsx` - `NextIntlClientProvider`, `SessionProvider`, `CartProvider`, `ToastProvider`, `CookieConsentBanner`.
- `app/globals.css` - global tokens and reusable classes such as `.glass-panel`, `.btn-primary`, `.input-field`, badges, alerts, headings.
- `components/` - page components and shared UI blocks.
- `contexts/CartContext.tsx` - cart storage and totals.
- `hooks/use-toast.ts` and `components/ToastProvider.tsx` - toast API/UI.
- `lib/` - auth config, Prisma, currency, payment flow, OpenAI, PDF, receipts, email, storage, job polling helpers.
- `prisma/schema.prisma` - database models.
- `src/data/courses.ts` - static/demo course fallback data.
- `i18n/en` and `i18n/ar` - localized messages for common, home, courses, cart, learn, pricing, dashboard, auth, FAQ, glossary, resources, about, contact, legal, top-up, refund.
- `public/` - favicon assets, logo, Visa/Mastercard SVGs, slide images, testimonial videos.
- `scripts/` - course/PDF/assets/check scripts.
- `docs/` - deployment/env/build docs.

### Styling Approach Found

Current UI is a dark purple/gold glassmorphism system:

- `body` is `bg-surface-0` with radial purple/gold background glow.
- Cards use `.glass-panel` and `.glass-panel-strong`.
- CTAs use purple gradient `.btn-primary`.
- Secondary and ghost buttons use translucent dark surfaces.
- Inputs use dark surfaces and purple focus rings.
- Badges include brand, gold, and neutral variants.
- Many pages reuse tiny text sizes (`text-[11px]`, `text-xs`) and compact rounded cards.
- Several pages use raw slate/cyan classes instead of the global design tokens, especially cart, checkout, cookie banner, and some learn subpages.

The redesign should replace this system substantially. Do not merely recolor the current glass panels.

### Pages and Routes Detected

Public/content routes:

- `/`
- `/about`
- `/contact`
- `/cookies`
- `/faq`
- `/glossary`
- `/pricing`
- `/privacy`
- `/refund-policy`
- `/resources`
- `/risk-and-disclaimer`
- `/terms`
- `/courses`
- `/courses/[slug]`
- `/learn`
- `/learn/position-sizing`
- `/learn/pre-session`
- `/learn/risk-management`
- `/learn/strategy-snapshot`
- `/learn/trade-journal`
- `/learn/weekly-review`
- `/cart`
- `/checkout`
- `/top-up`
- `/top-up/result`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Protected dashboard routes:

- `/dashboard`
- `/dashboard/courses`
- `/dashboard/custom-courses`
- `/dashboard/ai-strategies`
- `/dashboard/transactions`
- `/dashboard/receipts`
- `/dashboard/settings`

No explicit `app/not-found.tsx` was found. This means Next's default not-found page is probably used. This needs verification if the redesign scope expects a custom 404.

### API Routes Detected

- Auth: `/api/auth/[...nextauth]`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/change-password`
- Courses: `/api/courses`, `/api/courses/[slug]`, `/api/courses/purchase`, `/api/courses/purchased`
- Custom courses: `/api/custom-course`, `/api/custom-course/[id]`, `/api/custom-courses`
- AI strategies: `/api/ai-strategy`, `/api/ai-strategy/[id]`, `/api/ai-strategies`
- Billing/top-up: `/api/topup`, `/api/topup/init`, `/api/topup/callback`, `/api/topup/status`, `/api/transactions`, `/api/receipts/[transactionId]`, `/api/receipts/[transactionId]/pdf`, `/api/download/[type]/[jobId]`
- Other: `/api/contact`, `/api/inngest`, `/api/hello`, `/api/user/profile`

### Core Data Models

Prisma models include:

- `User` with email, password, profile/billing fields, `balance`, relations.
- NextAuth `Session` and `Account`.
- Legacy `Recipe` model.
- `Topup`.
- `TransferMitTopup` used for hosted payment records despite current Armenotech/APS gateway naming.
- `Course`.
- `CoursePurchase`.
- `CustomCourseRequest`.
- `AiStrategyRun`.
- `GenerationLog`.
- `PasswordResetToken`.

## Permissions and Approval Workflow

At the beginning of each implementation session, check what permissions are available.

Before making changes:
- inspect the current sandbox/approval mode if possible
- verify that file edits inside the project workspace are allowed
- verify that shell commands such as lint, typecheck, build, and Playwright checks can be run
- verify whether network access is needed

If additional approval is required for normal project work, request it once at the beginning of the session.

After the initial approval setup:
- do not interrupt the user for every small file edit
- do not ask for permission before routine edits inside the project workspace
- do not ask for permission before normal read-only inspection
- do not ask for permission before running safe project-local checks if already allowed
- continue working autonomously within the approved sandbox limits

Only ask the user again if:
- a command needs access outside the project workspace
- a command requires network access
- a destructive command is needed
- dependencies must be installed
- environment variables or secrets are missing
- a decision would change business logic, API contracts, payment, auth, token balance, generation, or database behavior

Never bypass safety rules.
Never run destructive commands without explicit approval.
Never modify files outside the project workspace unless explicitly approved.

### Core Features and Flows

- Bilingual locale switcher writes `user_locale` cookie, reloads, and updates `html.lang`/`dir`.
- Currency selector writes `user_currency` cookie and reloads; pricing uses GBP base conversion.
- Course list fetches `/api/courses`, supports search, level filter, market filter, loading, error, and empty states.
- Course API falls back to `src/data/courses.ts` static data on Prisma connection errors.
- Course detail page fetches DB/static course, localizes title/description where available, estimates duration/modules, adds to cart, and routes to checkout.
- Cart uses `localStorage` key `avenqor_cart`, prevents duplicate slugs, supports remove/clear/totals.
- Checkout requires auth, processes `?pack=` and `?custom=&currency=`, distinguishes token-pack/custom-top-up cart items from course items, offers tokens/card for courses, forces hosted card for top-ups, calls `/api/courses/purchase` for token course purchases, and calls `/api/topup/init` for hosted payment redirects.
- Top-up result page polls `/api/topup/status?reference=...`, updates session, clears hosted top-up cart items when complete, and returns users to checkout if course items remain.
- Pricing/top-up pages calculate token pack and custom top-up links.
- Custom course form calculates price via `lib/custom-course-pricing.ts`, validates required fields and consents, requires session and sufficient tokens, posts `/api/custom-course`, receives one job per language, updates URL with `jobId`.
- AI strategy form calculates price via `lib/ai-strategy-pricing.ts`, applies presets to hidden profile fields, validates required fields and consents, requires session and sufficient tokens, posts `/api/ai-strategy`, receives one job per language.
- Dashboard overview fetches transactions, purchased courses, AI strategies, and custom courses; displays balance, library/recent activity, billing snapshot, risk reminder.
- Dashboard courses library fetches `/api/courses/purchased`, filters/searches, shows download links.
- Custom courses dashboard fetches `/api/custom-courses`, filters/searches statuses, shows PDF/cover/download info.
- AI strategies dashboard fetches `/api/ai-strategies`, filters/searches statuses, shows download links by language.
- Transactions dashboard fetches `/api/transactions?limit=100`, converts amounts, filters types, calculates usage stats.
- Receipts dashboard fetches transactions, filters/searches, downloads receipt PDFs via `/api/receipts/[transactionId]/pdf`.
- Settings dashboard fetches and patches `/api/user/profile`, updates session, changes language cookie, opens change password modal, and displays notification/security/privacy controls.
- Contact form validates name/email/region/topic/accountId/language/message/consent and posts `/api/contact`.
- Cookie consent banner stores categories in localStorage and cookie, accepts/rejects/manages consent, and listens for `open-cookie-settings`.
- TradingView widget embeds external TradingView scripts with chart/overview/hotlist tabs and filters known TradingView console errors.
- Testimonials videos render `/video1.mp4` and `/video2.mp4` with custom poster/playback behavior.

### Risky Areas That Must Not Be Broken

- Auth redirects and callback URLs for `/checkout`, `/dashboard`, `/top-up`, and dashboard children.
- NextAuth session `user.balance` refresh after token purchases/top-ups/profile changes.
- Token balance checks and deductions for course purchase, custom course, and AI strategy requests.
- Hosted payment redirect and callback/status logic in `lib/topup-payment-flow.ts`.
- Top-up status polling and cart clearing logic on `/top-up/result`.
- Course fallback behavior when DB is unavailable.
- Localized course titles/descriptions and Arabic direction.
- Cart localStorage shape and slug conventions:
  - course slug
  - `token-pack-*`
  - `custom-top-up*`
- Download URL ownership checks in `/api/download/[type]/[jobId]`.
- Receipt PDF route ownership checks and blob download behavior.
- Cookie consent persistence and settings event.
- External TradingView widget script lifecycle.
- Inngest enqueue/refund behavior for generation requests.
- Static fallback courses and old/generated PDF path assumptions.

### Needs Verification

- README says Zustand is used for cart, but actual cart implementation is React Context in `contexts/CartContext.tsx`. Zustand is installed but not used for cart.
- README says OpenAI "GPT-5/GPT-4o class models"; `lib/config.ts` defaults to `gpt-4o-mini`, `gpt-4o`, `gpt-4.1-mini`, and `gpt-image-1-mini`.
- README says card-only Visa/Mastercard payments; code uses a hosted Armenotech/APS flow and legacy TransferMit model/config names.
- `package.json` name is `recipegen-nextjs`; Prisma schema comments and `Recipe` model appear legacy.
- Google OAuth provider is configured server-side, but no visible Google sign-in/register button was found in `LoginPage` or `RegisterPage`.
- `CardPaymentForm` exists but checkout currently uses hosted payment UI; verify whether the card form is unused, planned, or legacy before deleting or redesigning.
- `TopUpForm` exists but `TopUpPage` uses direct checkout links instead; verify whether it is unused, planned, or legacy before deleting or redesigning.
- `LearnPage` imports and calls `useJobStatus`, but no visible job progress/result panel was found in the inspected render output. Add a redesigned visible status panel only after verifying intended behavior.
- `/dashboard` billing snapshot stats (`tokensSpentLast30Days`, `aiStrategiesGenerated`, `coursesUnlocked`) are hardcoded zero; needs verification before presenting as live metrics.
- `/dashboard/courses` has an AI Strategy type filter but currently fetches only purchased courses; needs verification.
- Settings notification toggles, course-language preference, export data, and delete account controls appear local/UI-only or incomplete; needs verification.
- `CurrencySelector` includes TODO flag icons for USD and SR using `gb.svg`; needs verification/assets.
- `HeroSlideshow` CTA currently links to `#`; needs verification.
- `FAQAccordion` empty state links to `/allergens`, which appears legacy and not a valid route; needs verification.
- `ContactPage` side-info links to `/privacy-policy`, but detected privacy route is `/privacy`; needs verification.
- No custom `app/not-found.tsx` was found; needs verification if a custom 404 is required.

## 4. Existing Functionality To Preserve

- [ ] Root layout metadata, favicon/logo assets, header/footer mounting, provider wrapping.
- [ ] `NextIntlClientProvider` locale loading for English and Arabic message bundles.
- [ ] `LocaleProvider` updating `html.lang` and `html.dir`.
- [ ] `LanguageToggle` cookie write/reload behavior.
- [ ] `CurrencySelector` desktop/mobile cookie write/reload behavior.
- [ ] Currency conversion formulas in `lib/currency-utils.ts`.
- [ ] Token pack price calculation from translations and token counts.
- [ ] Cart localStorage persistence under `avenqor_cart`.
- [ ] Cart duplicate prevention by slug.
- [ ] Mini cart hover behavior, item count badge, remove links, and checkout/cart links.
- [ ] Public course list data fetch, DB/static fallback, loading, error, empty states.
- [ ] Course list search, level filter, market filter.
- [ ] Course card localized title/description where available.
- [ ] Course detail DB/static data, localized title/description, modules, duration, cover image, add-to-cart, buy-with-tokens, buy-with-card.
- [ ] Checkout auth redirect to `/login?callbackUrl=/checkout`.
- [ ] Checkout URL param processing for `?pack=` and `?custom=&currency=`.
- [ ] Checkout token-pack/custom-top-up detection and forced card payment.
- [ ] Checkout token payment for course purchases via `/api/courses/purchase`.
- [ ] Checkout insufficient balance handling and top-up links.
- [ ] Checkout hosted payment creation via `/api/topup/init`.
- [ ] Hosted payment redirect to provider.
- [ ] Top-up result polling by reference ID and terminal-state handling.
- [ ] Top-up session update and cart clearing behavior.
- [ ] Receipt availability and dashboard receipt links.
- [ ] Auth login credentials flow and callback URL redirect.
- [ ] Registration validation fields and automatic sign-in behavior.
- [ ] Forgot password RHF/Zod validation and toast/success behavior.
- [ ] Reset password token, strength, consent, success/error states, delayed redirect.
- [ ] Change password modal validation and `/api/auth/change-password`.
- [ ] Profile fetch/save in settings via `/api/user/profile`.
- [ ] Protected dashboard route redirects.
- [ ] Dashboard navigation active states and all dashboard links.
- [ ] Dashboard balance, library, transaction, custom course, AI strategy, receipt, and settings data fetches.
- [ ] Dashboard table/list filters/search/status badges/download links.
- [ ] Transaction aggregation from top-ups, pending payments, custom courses, AI strategies, and course purchases.
- [ ] Receipt PDF client download behavior.
- [ ] Custom course form selections, pricing, token balance check, consent, API request, jobs array parsing, URL `jobId` handling.
- [ ] AI strategy form presets, hidden profile fields, pricing, token balance check, consent, API request, jobs array parsing, URL `jobId` handling.
- [ ] `/api/custom-course/[id]` and `/api/ai-strategy/[id]` status polling contracts.
- [ ] `/api/download/[type]/[jobId]` owner-checked redirects.
- [ ] Contact form fields, validation, API call, toast success/error, reset.
- [ ] Cookie banner localStorage/cookie persistence, categories, accept/reject/manage/save.
- [ ] Cookie settings event from cookies page.
- [ ] TradingView chart/overview/hotlist tabs and script cleanup.
- [ ] Testimonial video sources, controls, poster/start behavior, 18-second cap on video2.
- [ ] Legal pages content from i18n including table of contents, sections, warnings.
- [ ] Education-only and high-risk notices across courses, pricing, learn forms, FAQ, legal, dashboard.
- [ ] Footer legal/company/social/payment/logo links.

## 5. New Design Direction

The redesign should feel like a premium fintech education workbench, not a crypto hype template. It should communicate structure, risk awareness, credibility, and depth. The user should immediately understand that Avenqor sells education products, custom PDFs, and AI strategy documents through a token-based account system.

### Visual Direction

- Premium trading education product.
- Modern fintech information architecture.
- Trustworthy, restrained, not casino-like.
- Educational, systematic, and conversion-focused.
- Clean but visually rich through layout, hierarchy, data visuals, product previews, and useful UI components rather than decorative glow.
- More editorial and modular than the current card-heavy glass layout.
- Use actual product signals: PDF covers, module timelines, token wallet summaries, dashboard previews, generation status panels, risk notices, course outlines, and receipt/payment status surfaces.

### Color Palette Direction

Move away from the current all-dark purple/gold glass system.

Recommended direction:

- Base canvas: near-white or very light cool neutral for public education pages, e.g. `#F7F8FA`.
- Ink: deep neutral `#101318`, graphite `#2B3037`, muted text `#667085`.
- Primary action: rich teal or cyan-green, e.g. `#008C8C` or `#007D7A`.
- Secondary accent: disciplined blue-violet used sparingly for AI/generation, e.g. `#5156D9`.
- Risk/accent: amber `#D99A00` for warnings and risk, not for general decoration.
- Success/error: accessible green and red tones.
- Dark surfaces: use as intentional workbench panels, dashboard rails, checkout summaries, or hero contrast areas, not the entire site.
- Avoid a one-note palette. Each section should have a clear semantic color role.

### Typography Direction

- Keep existing font pipeline unless changing fonts is necessary; use `Inter` for body and `Space Grotesk` for display/section headings.
- Create a clear type scale: hero 52-72 desktop, section 32-44, page title 36-52, card title 18-22, body 15-18, metadata 12-13.
- Stop overusing `text-[11px]` for meaningful content. Reserve tiny text for metadata only.
- Use normal letter spacing for most text. Avoid negative letter spacing except where the existing font truly needs it.
- Increase line-height for legal/resources/learn pages.

### Spacing System

- Use a more deliberate 4/8px scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Public pages should have generous vertical sections with clear groups.
- Dashboard pages should be denser but still readable.
- Forms should use consistent field grouping, row gaps, and section dividers.

### Border Radius System

- Use restrained radii: 6-8px for controls/cards, 10-12px for larger panels, 16px only for major containers/modals.
- Avoid every element becoming a pill.
- Preserve circular avatars/icons where appropriate.

### Card Style

- Replace generic glass cards with purpose-specific cards:
  - Course cards with cover thumbnail, level/market strip, module/count metadata, price/token footer.
  - Token packs with comparison rows and clear recommended state.
  - Dashboard panels with table/list density and strong labels.
  - Legal/resource cards with readable typography and TOC.
  - Generation status cards with progress/stage/result/download affordances.
- Cards should not all look identical. Use content type and hierarchy to drive structure.

### Button Style

- Primary buttons should be strong, flat or subtly dimensional, with clear hover/focus/disabled states.
- Secondary buttons should be quiet outlines or neutral filled controls.
- Icon buttons should use Lucide icons and tooltips where labels are not visible.
- Preserve `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger` class contracts unless replacing them with a new shared component system and updating all usages safely.

### Form Style

- Use visible labels, grouped sections, helper text, validation messages, and clear required indicators.
- Multi-select chips should become segmented/toggle groups with better active states.
- Long forms (`/learn`, register, contact) need scannable grouped sections and sticky cost/summary panels on desktop.
- Checkboxes must have large tap targets and readable consent text.

### Header Style

- Redesign header as a premium product navigation shell.
- Preserve logged-in/logged-out nav differences, learn dropdown, currency selector, language toggle, balance badge, top-up, cart, profile/logout, and mobile menu.
- Improve mobile menu hierarchy and make cart/top-up/profile easier to find.
- Use actual logo asset `/logo.png` unless redesign explicitly updates branding assets.

### Footer Style

- Preserve company details, support email/phone, legal links, social links, Visa/Mastercard logos, and route links.
- Redesign as a stronger footer with clearer columns, compliance/risk copy, and better mobile stacking.

### Motion and Animation

- Use subtle motion: reveal, progress, hover, active/pressed, status transitions.
- Avoid excessive hover lift on every card.
- Preserve reduced-motion friendliness.
- TradingView and videos should not be obstructed by motion.

### Responsive Behavior

- Mobile first. All controls must be tappable and text must not overlap or truncate important values.
- Tablet should use two-column grids where useful.
- Desktop should use richer split layouts, sticky summaries, dashboard rails, and data tables that remain readable.
- Large desktop can use wider content lanes but should not stretch paragraphs beyond readable measure.

## 6. Redesign Scope

The redesign applies to the entire website, not only the homepage. All detected routes must either be visually redesigned or intentionally documented as unchanged for a functional reason.

Routes in scope:

- `/`
- `/about`
- `/contact`
- `/cookies`
- `/faq`
- `/glossary`
- `/pricing`
- `/privacy`
- `/refund-policy`
- `/resources`
- `/risk-and-disclaimer`
- `/terms`
- `/courses`
- `/courses/[slug]`
- `/learn`
- `/learn/position-sizing`
- `/learn/pre-session`
- `/learn/risk-management`
- `/learn/strategy-snapshot`
- `/learn/trade-journal`
- `/learn/weekly-review`
- `/cart`
- `/checkout`
- `/top-up`
- `/top-up/result`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/dashboard/courses`
- `/dashboard/custom-courses`
- `/dashboard/ai-strategies`
- `/dashboard/transactions`
- `/dashboard/receipts`
- `/dashboard/settings`

Shared UI in scope:

- Header, mobile menu, footer.
- Home section wrappers and animation strategy.
- Buttons, cards, badges, inputs, selects, textareas, checkboxes, tables, alerts, toasts, loading, empty, success, error, disabled states.
- Course cards, token packs, cart/checkout summaries, dashboard cards, filters, tables, legal TOC/content blocks, cookie banner, modals.

## 7. Phase-Based Implementation Plan

## Phase Execution Rule

Implementation must be done phase by phase.

Do not implement all phases in one massive change.

For each implementation run:
- work only on the explicitly requested phase or phases
- do not continue to the next phase unless the user asks for it
- keep changes scoped to the current phase
- preserve all business logic and API contracts
- avoid unrelated refactors

After each phase:
- stop
- summarize changed files
- explain what was redesigned
- list commands run
- list Playwright/browser checks performed
- list known issues or risks
- recommend the next phase

This is required to reduce the risk of breaking auth, checkout, token balance, dashboard, i18n, payment, downloads, and generation flows.

### Phase 0 — Safety, Audit, and Baseline

- Read README and README-like root files before touching UI.
- Inspect app routes, shared components, API/data contracts, translations, global CSS, Tailwind config, provider setup, and existing dirty worktree.
- Identify fragile logic: auth redirects, token balance, payment status polling, generation job submission, downloads, receipts, i18n/RTL, cookies/localStorage.
- Run initial `npm run lint`, `npm run typecheck`, and `npm run build` if environment and dependencies allow.
- If commands fail because of existing codebase issues, record baseline failures before redesign edits.
- Create a safe implementation path that starts with design tokens and shared primitives, then updates page families.
- Do not change API/backend logic during this phase.

### Phase 1 — Global Design System

- Redesign global styles in `app/globals.css` and Tailwind theme in `tailwind.config.js`.
- Create/update design tokens for color, typography, spacing, radius, shadows, focus rings, borders, and state colors.
- Redesign `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` or replace with shared components while preserving call sites.
- Redesign `.input-field`, selects, textareas, checkboxes, segmented controls, toggles, filters.
- Redesign `.badge-*`, `.alert-*`, loading, success, error, warning, empty, disabled, skeleton states.
- Standardize section headings and content width rules.
- Replace the current one-note dark glass pattern with a more varied premium design language.
- Ensure existing raw slate/cyan pages can migrate into the new system without route or logic changes.

### Phase 2 — Layout Shell

- Redesign `app/layout.tsx` visual shell only if needed, preserving providers.
- Redesign `Header` with logged-in/logged-out desktop nav, learn dropdown, currency/language controls, balance, top-up, cart, profile/logout.
- Redesign mobile menu with clear hierarchy, cart/top-up/account access, language/currency access, and route links.
- Redesign `Footer` with stronger compliance, legal, support, company, social, and payment information.
- Create consistent page containers and responsive grid rules.
- Preserve `Header`, `Footer`, `Providers`, `LocaleProvider`, `CartProvider`, `ToastProvider`, and `CookieConsentBanner` wiring.

### Phase 3 — Homepage Redesign

- Change the homepage structure, not just styles.
- Rebuild hero around the product promise: curated courses, custom PDFs, AI strategy PDFs, tokens, dashboard/library.
- Use a stronger visual product story: course cover carousel, token wallet preview, generation timeline, dashboard/library preview, or compact market education workbench.
- Reorder sections for conversion:
  1. premium hero with product promise and CTAs,
  2. proof/product modules,
  3. learning paths,
  4. featured courses,
  5. tokens/payment explanation,
  6. custom/AI generation,
  7. testimonials videos,
  8. resources/glossary,
  9. risk/FAQ,
  10. final CTA.
- Preserve homepage course fetching from `/api/courses`, loading/empty behavior, TradingView widget, testimonial videos, TokenPacks, FAQAccordion, and route links.
- Fix or verify `HeroSlideshow` `href="#"` before exposing it as a real CTA.

### Phase 4 — Core Product/Course Pages

- Redesign `/courses` listing with better filters/search, content hierarchy, result count, category explanation, responsive cards, loading/error/empty states.
- Redesign `/courses/[slug]` detail with stronger product page structure: hero, course summary, purchase panel, module timeline, outcomes, materials, risk, FAQs, related next steps.
- Preserve course data loading, static fallback, localized fields, cart add, checkout routing, token/card flow, PDF metadata, module fallback.
- Avoid hardcoding course modules or marketing claims beyond existing data/translations unless documented as placeholder or moved into content data.

### Phase 5 — Pricing, Tokens, Top-Up, Checkout

- Redesign `/pricing`, `/top-up`, `/cart`, `/checkout`, and `/top-up/result` as one coherent billing system.
- Redesign token packs/pricing cards with comparison rows, recommended state, custom top-up, currency explanation, token exchange rate, education/risk notes.
- Redesign cart and mini cart for courses, token packs, and custom top-ups.
- Redesign checkout payment method selection, insufficient balance, hosted checkout panel, and sticky order summary.
- Redesign payment result states: checking, pending, completed, failed/cancelled/expired/refunded.
- Preserve cart URL params, auth redirects, payment API calls, `window.location.href` provider redirect, polling, session update, cart clearing, and return-to-checkout behavior.

### Phase 6 — Custom Request / AI Generator / Tool Pages

- Redesign `/learn` tabs as a serious generation workspace with form grouping and sticky price/status sidebar.
- Custom course form: preserve experience, markets, deposit, risk, trading style, days, platforms, goals, notes, languages, consents, price calculator, token balance, API post.
- AI strategy form: preserve preset, market, timeframe, risk per trade, max trades, instruments, focus, detail level, languages, consents, hidden profile mapping, price calculator, token balance, API post.
- Add/redesign visible job status/result displays only after verifying current intended behavior.
- Redesign token usage notices, insufficient balance, submit loading, success, active-job/start-new confirmation, and error states.
- Redesign static learn tool pages as a cohesive resource library with better readability and sidebar navigation.

### Phase 7 — Auth and Dashboard


- Redesign `/login`, `/register`, `/forgot-password`, `/reset-password`.
- Preserve credentials sign-in, registration API payload, auto sign-in, password reset token handling, forms, validation, toasts, callback redirects.
- Verify Google OAuth UI before adding/removing provider buttons.
- Redesign dashboard shell and `DashboardNavigation`.
- Redesign `/dashboard` overview with live balance, recent items, library, risk reminder, billing snapshot.
- Redesign `/dashboard/courses`, `/dashboard/custom-courses`, `/dashboard/ai-strategies`, `/dashboard/transactions`, `/dashboard/receipts`, `/dashboard/settings`.
- Preserve all data fetches, filters, search, status mapping, download links, receipt blob download, profile save, change password modal.
- Do not present UI-only settings as functional without verification.

### Phase 8 — Secondary Pages

- Redesign `/about`, `/faq`, `/contact`, `/glossary`, `/resources`, `/terms`, `/privacy`, `/cookies`, `/risk-and-disclaimer`, `/refund-policy`.
- Improve readability, section hierarchy, tables, TOC, legal summaries, risk disclosures, contact support flow, glossary search/filter, resource links.
- Preserve translation-driven content, contact form API, cookie settings event, legal route links, support/company info.
- Verify bad links before redesign exposes them prominently.

### Phase 9 — Responsive, Accessibility, and Motion Pass

- Test mobile, tablet, desktop, and large desktop layouts.
- Check text wrapping inside buttons/cards/tables/filter chips.
- Verify keyboard navigation for header menus, mobile menu, forms, tabs, accordions, filters, cookie banner, modals.
- Add visible focus states for all interactive elements.
- Check contrast in all states, especially warning and disabled states.
- Ensure semantic headings, form labels, fieldsets, table headers, alt text, and ARIA only where needed.
- Reduce layout shifts from images, TradingView widget, videos, and dashboards.
- Ensure motion is subtle and respects reduced-motion expectations.

### Phase 10 — Final QA and Build

- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Start dev server and manually smoke-test all main flows if feasible.
- Verify routes, auth, cart, checkout, top-up, course purchase, dashboard, generation request, downloads, contact, language/currency, cookie banner, responsive layouts.
- Document any tests not run and why.
- Prepare final report using the format in section 16.

## 8. Page-by-Page Redesign Requirements

### `/` - `app/page.tsx`

- Current purpose: Homepage marketing and product entry. Fetches featured courses from `/api/courses`; shows hero, slideshow, TradingView market snapshot, learning paths, featured courses, testimonial videos, how-it-works, token system, token packs, glossary/resources, risk notice, FAQ, final CTA.
- Preserve: `/api/courses` fetch, selected featured course logic or improved dynamic equivalent, `HeroSlideshow`, `TradingViewWidget`, `CourseCard`, `PathCard`, `FAQAccordion`, `TokenPacks`, `TestimonialsVideos`, CTAs to `/courses`, `/learn?tab=custom`, `/learn?tab=ai`, `/pricing`, `/resources`, `/glossary`, `/risk-and-disclaimer`.
- Visually change: Make it a premium product story, not stacked glass cards. Use product proof, course previews, token wallet preview, generation workflow, and dashboard/library teaser.
- Suggested layout: full-width hero; product module strip; three pathways; dynamic course carousel/grid; token economy explanation; custom/AI generation comparison; testimonials; resources; risk/FAQ; final CTA.
- Risks: Do not break course fetch/fallback; do not hide education-only disclaimers; do not make TradingView imply signals/advice.

### `/about` - `components/AboutPage.tsx`

- Current purpose: Explains what Avenqor is/is not, who it is for, course-building approach, regions/currencies/languages, principles, and never-does claims from translations.
- Preserve: translation-driven arrays, risk/education-only stance, regional/currency/language details.
- Visually change: Use a more editorial company/product narrative with credibility blocks, principles, and compliance contrast.
- Suggested layout: mission hero, "what we are/not" split, audience profiles, methodology, regions/currencies/languages, principles, risk posture CTA.
- Risks: Do not invent company claims, regulation claims, testimonials, or guarantees.

### `/contact` - `components/ContactPage.tsx`

- Current purpose: Support/contact form with name, email, region, topic, optional account ID, language, message, consent, quick notes, side cards.
- Preserve: React Hook Form/Zod schema, `/api/contact` payload, toast success/error, reset on success, all form fields and consent.
- Visually change: Use a clearer support intake layout with a strong form panel, contact expectations, FAQ/risk links, region cards.
- Suggested layout: support hero, two-column contact form + help sidebar, response expectation, legal/FAQ links, final CTA.
- Risks: Current side-info link references `/privacy-policy`, but route is `/privacy`; needs verification.

### `/cookies` - `components/CookiesPage.tsx`

- Current purpose: Cookie policy with hero, snapshot, TOC, sections, tables, and button to open cookie settings event.
- Preserve: translation-driven cookie content, table rendering, `open-cookie-settings` event.
- Visually change: Improve legal readability, sticky TOC, better tables on mobile, settings CTA.
- Suggested layout: document header, last-updated/meta, sticky side nav, content sections, cookie table, settings panel.
- Risks: Cookie banner storage keys and event must remain unchanged.

### `/faq` - `components/FAQPage.tsx`

- Current purpose: FAQ page with translation-driven FAQ grid, hero risk card, token/payment/delivery cards, CTA.
- Preserve: FAQ items/categories, risk disclaimer link, pricing/contact links.
- Visually change: Add search/category affordance if feasible using existing data; improve accordion behavior instead of static cards if appropriate.
- Suggested layout: FAQ hero, category navigation, accordion/search, token/payment/delivery support section, contact CTA.
- Risks: Do not contradict legal/risk language.

### `/glossary` - `components/GlossaryPage.tsx`

- Current purpose: Searchable/filterable glossary terms from translations with categories Forex/Crypto/Binary/Risk/Process/Psychology.
- Preserve: search, category filter, translated category mapping, empty state.
- Visually change: Make it a reference tool with alphabet/category navigation and clearer term cards.
- Suggested layout: reference hero, search bar, category segmented control, term grid/list, education-vs-advice sidebar.
- Risks: Category keys are English internally while labels are translated; preserve mapping.

### `/pricing` - `components/PricingPage.tsx`

- Current purpose: Pricing/tokens page with token packs, custom top-up, direct payment explanation, how tokens work, risk/legal note, CTA.
- Preserve: token pack source from `home.tokenPacks`, currency calculation, custom amount sanitization, links to `/checkout?pack=` and `/checkout?custom=&currency=`, risk note.
- Visually change: Make pricing a conversion page with clear token economy, pack comparison, custom amount, currency support, secure payment explanation.
- Suggested layout: token wallet hero, pack comparison cards, custom top-up calculator, how tokens work timeline, billing/security note, risk note, CTA.
- Risks: Do not change token formula `100 tokens = 1 GBP` equivalent.

### `/privacy` - `components/PrivacyPage.tsx`

- Current purpose: Privacy policy document with hero, meta, badges, TOC, sections, lists/definitions/notes.
- Preserve: translation-driven legal content and anchors.
- Visually change: Improve document readability with sticky TOC and better table/list typography.
- Suggested layout: legal document shell reused with terms/risk/refund/cookies variants.
- Risks: Do not alter legal meaning.

### `/refund-policy` - `components/RefundPage.tsx`

- Current purpose: Refund policy document with digital-only/payment/support warnings and sections.
- Preserve: content blocks, TOC, warning accents, legal links.
- Visually change: Use the shared legal document shell with clear summary and support CTA.
- Risks: Do not soften refund conditions or digital content warnings.

### `/resources` - `components/ResourcesPage.tsx`

- Current purpose: Resource hub with checklist/template/worksheet items from translations; some links route to learn subpages; non-linked items show preview/download buttons.
- Preserve: resource item rendering, links to `/learn/risk-management`, `/learn/trade-journal`, `/learn/weekly-review`, `/learn/pre-session`, `/learn/position-sizing`, `/learn/strategy-snapshot`.
- Visually change: Make it a practical toolkit hub with stronger grouping by resource type and clearer CTAs.
- Suggested layout: resources hero, resource type filters/cards, workflow section, links to learn subpages, CTA to courses/custom/AI.
- Risks: Current resource link mapping is based on exact English titles; preserve or refactor safely to route metadata.

### `/risk-and-disclaimer` - `components/RiskDisclaimerPage.tsx`

- Current purpose: High-risk and education-only disclaimer document.
- Preserve: all translation content, warning accent, TOC, high-risk/no-advice badges.
- Visually change: Make risk warnings prominent but readable; use consistent legal shell.
- Suggested layout: warning hero, summary card, sticky TOC, sections, final acknowledgement/CTA.
- Risks: Do not reduce prominence of high-risk disclaimers.

### `/terms` - `components/TermsPage.tsx`

- Current purpose: Terms and conditions document with summary, meta, TOC, content blocks.
- Preserve: translation content, anchors, definitions/lists/notes.
- Visually change: Legal shell with better typography and mobile TOC.
- Risks: Do not alter terms meaning.

### `/courses` - `components/CoursesPage.tsx`

- Current purpose: Course listing with API fetch, search, level/market filters, loading/error/empty states, course cards, sidebar CTAs.
- Preserve: fetch to `/api/courses`, `data` or array payload handling, search/filter logic, loading/error/empty states, `CoursesPageCard`, add-to-cart, links to course detail and learn/custom/AI.
- Visually change: Product listing layout with better filter rail or toolbar, course card hierarchy, sidebar trust/risk/token info.
- Suggested layout: hero with category explanation, sticky filter/search bar, responsive cards, sidebar "custom/AI alternative", empty state with reset filters.
- Risks: Do not break course fallback or localized cards.

### `/courses/[slug]` - `app/courses/[slug]/page.tsx` + `CourseDetailPage`

- Current purpose: Course detail product page from DB/static fallback with localized display, modules, pricing/purchase panel, FAQ, related custom/AI CTAs.
- Preserve: `notFound()` behavior, `demoCourses` fallback, normalized Decimal values, modules from DB or fallback, `addToCart`, checkout routing, localized title/description, cover image.
- Visually change: Rebuild as premium course product page with stronger hero, sticky purchase summary, module timeline, learning outcomes, material preview, risk block, FAQs.
- Suggested layout: breadcrumb, course hero with cover, metadata, price/tokens, sticky CTA; outcomes; module timeline; who it is/is not for; materials; FAQ; related products.
- Risks: Some "what you will learn/who for/materials" copy is hardcoded; preserve existing behavior but consider moving to translations/data in later non-redesign work.

### `/learn` - `components/LearnPage.tsx`

- Current purpose: Tabbed custom course and AI strategy generation workspace.
- Preserve: URL tab param, form state, all fields, pricing calculators, session checks, insufficient balance routing, consents, API payloads, jobs array parsing, URL `jobId` updates, active-job confirmation.
- Visually change: Split into a high-quality tool workspace with form sections, sticky estimate/balance/sidebar, visible status/result area after verification.
- Suggested layout: product/tool hero, tabbed workspace, form grouped by profile/market/risk/output/consent, sticky token estimate, delivery/risk panels.
- Risks: `useJobStatus` polling exists but UI is not visibly rendered; needs verification before adding status UI.

### `/learn/position-sizing`

- Current purpose: Static educational article/tool page about position sizing.
- Preserve: translation-driven hero/sections/sidebar content and links.
- Visually change: Use an article/workbook layout with sticky sidebar, formula cards, examples, warnings, related links.
- Risks: Education-only stance must remain.

### `/learn/pre-session`

- Current purpose: Static educational checklist page about pre-session preparation.
- Preserve: translation content, sidebar, links.
- Visually change: Checklist/workflow format with scannable steps and printable-style blocks.
- Risks: Do not imply trading advice.

### `/learn/risk-management`

- Current purpose: Static educational page about risk management foundations.
- Preserve: translation content, examples, warnings, sidebar.
- Visually change: Stronger lesson page with concepts, examples, risk cards, related CTAs.
- Risks: High-risk/education disclaimers must remain visible.

### `/learn/strategy-snapshot`

- Current purpose: Static educational page about strategy snapshots; currently uses raw slate/cyan styling separate from global tokens.
- Preserve: translation content and route links.
- Visually change: Bring into unified redesign system while giving strategy-template content a strong document/template visual.
- Risks: Avoid maintaining inconsistent raw slate theme.

### `/learn/trade-journal`

- Current purpose: Static educational page about daily trade journal principles; uses raw slate/cyan styling.
- Preserve: translation content and route links.
- Visually change: Journal/workbook style with example blocks and routines.
- Risks: Avoid inconsistent theme and tiny text.

### `/learn/weekly-review`

- Current purpose: Static educational page about weekly review playbook; uses raw slate/cyan styling.
- Preserve: translation content and route links.
- Visually change: Review workflow, metrics cards, weekly cadence visual.
- Risks: Do not imply performance guarantees.

### `/cart` - `app/cart/page.tsx`

- Current purpose: Cart page for course items, token packs, custom top-ups, remove items, total, checkout, empty state.
- Preserve: cart context, localized title, item type detection, images, remove, continue shopping, checkout link, totals.
- Visually change: Checkout-quality cart with item rows, item type labels, order summary, empty state, mobile friendly rows.
- Suggested layout: cart header, item list, sticky order summary, token explanation, empty state CTA.
- Risks: Do not change slug type detection.

### `/checkout` - `app/checkout/page.tsx`

- Current purpose: Auth-protected checkout for courses and token top-ups, URL param ingestion, token/card payment selection, hosted payment redirect, course token purchase.
- Preserve: auth redirect, `?pack`/`?custom` cart insertion, token purchase detection, payment method logic, insufficient balance, `/api/courses/purchase`, `/api/topup/init`, session update, clear cart, route redirects.
- Visually change: Make checkout highly trustworthy and clear. Separate review, payment method, balance, token top-up explanation, and order summary.
- Risks: Do not submit token packs through token payment; do not lose `hasProcessedParams`/empty-cart redirect protections.

### `/top-up` - `components/TopUpPage.tsx`

- Current purpose: Auth-protected token top-up page with packs and custom amount linking to checkout.
- Preserve: auth gate in route, currency calculation, custom amount sanitization, checkout links.
- Visually change: Wallet/top-up screen with balance context, packs, custom amount, currency note, security note.
- Risks: `TopUpForm` may be legacy; needs verification before removal.

### `/top-up/result` - `components/TopUpSuccessContent.tsx`

- Current purpose: Hosted payment status result page polling reference ID, showing pending/completed/failed states, session update, cart clearing, return to checkout or dashboard/receipts.
- Preserve: `reference` param, polling intervals, terminal state handling, `update()`, `clearCart()` only for hosted top-up-only cart, course-items return-to-checkout behavior.
- Visually change: Payment status page with clear state-specific panels, reference details, charged/tokens, progress/auto-refresh, next actions.
- Risks: Do not clear course items from cart after top-up; do not stop polling early.

### `/login` - `components/LoginPage.tsx`

- Current purpose: Credentials sign-in, callback URL redirect, forgot/register links.
- Preserve: `signIn('credentials')`, error states, loading, callback URL, redirect if authenticated.
- Visually change: Premium account entry page with clear value/sidebar, compact form, trust/security note.
- Risks: Google provider configured but no visible button; needs verification before adding OAuth UI.

### `/register` - `components/RegisterPage.tsx`

- Current purpose: Full registration form with first/last name, DOB, email, phone, address, country, postal, password/confirm, terms consent, API call, auto sign-in.
- Preserve: field names and POST payload to `/api/auth/register`, validation, allowed countries, success/error states, auto sign-in.
- Visually change: Multi-section registration flow with better grouping and progress/summary.
- Risks: Do not remove required compliance/profile fields.

### `/forgot-password` - `components/ForgotPasswordPage.tsx`

- Current purpose: Email form with RHF/Zod validation, `/api/auth/forgot-password`, no enumeration UX, toast/success.
- Preserve: email payload, success behavior, login links.
- Visually change: Account security page matching auth shell.
- Risks: Do not reveal whether email exists.

### `/reset-password` - `components/ResetPasswordPage.tsx`

- Current purpose: Token-based password reset with strength indicator, confirm password, consent, success/error states.
- Preserve: `token` query requirement, `/api/auth/reset-password` payload, success redirect after 3 seconds, error state.
- Visually change: Account security page with clearer states and strength meter.
- Risks: Do not weaken validation or remove consent.

### `/dashboard` - `components/DashboardPage.tsx`

- Current purpose: Auth-protected overview with token balance, recent activity, library, risk reminder, billing snapshot, quick actions, recent transactions.
- Preserve: fetches to `/api/transactions`, `/api/courses/purchased`, `/api/ai-strategies`, `/api/custom-courses`, session balance, route links, downloads.
- Visually change: Premium account dashboard with stronger information hierarchy, compact cards, live activity, clear next actions.
- Risks: Some stats are hardcoded zero; needs verification.

### `/dashboard/courses` - `components/LibraryPage.tsx`

- Current purpose: Purchased course library with search/type/level filters, cards, download links.
- Preserve: `/api/courses/purchased` fetch, localized course display, filters/search, download links, empty state.
- Visually change: Library layout with cards/list toggle, strong download affordance, course metadata.
- Risks: AI strategy filter exists but data fetch only includes courses; needs verification.

### `/dashboard/custom-courses` - `components/CustomCoursesPage.tsx`

- Current purpose: Custom course request list with status mapping, search/status filter, PDF/cover links.
- Preserve: `/api/custom-courses` fetch, status mapping, filters/search, new request link, switch to AI link, downloads/statuses.
- Visually change: Request tracker with progress/status cards or responsive table, ETA, assets state, download actions.
- Risks: Status labels differ between DB and UI; preserve mapping.

### `/dashboard/ai-strategies` - `components/AiStrategiesPage.tsx`

- Current purpose: AI strategy list with search/status filter, table, download PDF links by language.
- Preserve: `/api/ai-strategies`, statuses `processing|ready|failed`, `pdfLinks`, download links.
- Visually change: Strategy tracker table/cards with clear statuses, language-specific downloads, generation CTA.
- Risks: Do not break download target URLs or language labels.

### `/dashboard/transactions` - `components/BillingPage.tsx`

- Current purpose: Billing/transaction history from `/api/transactions?limit=100`, filters, balance, usage stats, receipt link.
- Preserve: fetch, currency conversion, type filters, status pills, last receipt link, top-up links.
- Visually change: Financial ledger with clearer balance, spend/use distribution, responsive table/cards, filters.
- Risks: `balanceAfter` is placeholder; do not present as live unless implemented.

### `/dashboard/receipts` - `components/ReceiptsPage.tsx`

- Current purpose: Receipts/invoices list with type/search filters and PDF download blob.
- Preserve: `/api/transactions?limit=100`, `receiptAvailable`, `/api/receipts/[id]/pdf`, blob download.
- Visually change: Receipt center with invoice cards/table, statuses, download affordance.
- Risks: Do not make pending transactions downloadable when `receiptAvailable` is false.

### `/dashboard/settings` - `components/SettingsPage.tsx`

- Current purpose: Profile display/edit, dashboard language cookie, course language local state, currency note, notifications toggles, change password, 2FA coming soon, data/privacy controls.
- Preserve: `/api/user/profile` GET/PATCH, `updateSession`, change password modal, language cookie reload, static/coming-soon states.
- Visually change: Settings sections with clear account/security/preferences/privacy grouping.
- Risks: Notification toggles, course language, export/delete appear UI-only; needs verification before presenting as saved backend preferences.

## 9. Component-by-Component Redesign Requirements

### `Header`

- Current role: Global sticky navigation with logo, desktop nav, learn dropdown, auth-aware links, currency/language, balance, top-up, cart hover dropdown, profile/logout, mobile menu.
- Preserve contracts: session usage, `useCart`, `CurrencySelector`, `LanguageToggle`, `MiniCart`, route links, signOut, learn dropdown routes.
- Redesign: Premium navigation shell with clearer public/account modes, better mobile menu, visible cart/top-up/account affordances, improved keyboard/focus states.
- Do not break: cart hover close delays, mobile learn toggle, auth-aware balance and profile display.

### `Footer`

- Current role: global footer with brand, social links, nav columns, company info, legal links, support contact, Visa/Mastercard logos.
- Preserve: all routes, company name/number/address, email, phone, social URLs, payment logos.
- Redesign: More structured compliance footer with readable columns and better mobile layout.
- Do not break: legal/payment/company content.

### `HomeSection` and `AnimatedSection`

- Current role: content width and reveal animation wrapper.
- Preserve: reusable section behavior or replace safely.
- Redesign: Create responsive container/section primitives with consistent vertical rhythm and optional animation variants.
- Do not break: all pages importing `HomeSection`.

### `HeroSlideshow`

- Current role: four translated slides with `/slide_1.webp` to `/slide_4.webp`, auto-rotate, dots, image backgrounds.
- Preserve: image assets, translations, timing/dots unless intentionally changed.
- Redesign: Make it a product/course preview, not a generic card.
- Do not break: image aspect, priority, alt text. `href="#"` needs verification.

### `TradingViewWidget`

- Current role: External TradingView chart/overview/hotlist tabs with script lifecycle and console filtering.
- Preserve: tabs, script cleanup, container height, external widget behavior.
- Redesign: New frame and surrounding educational context.
- Do not break: direct DOM script injection cleanup.

### `TestimonialsVideos`

- Current role: video testimonial section with `/video1.mp4`, `/video2.mp4`, poster/playback effects.
- Preserve: video refs, controls, source files, `playsInline`, labels.
- Redesign: Better media grid, caption/context, responsive aspect ratios.
- Do not break: video2 18-second cap if still required.

### `CourseCard`, `CoursesPageCard`, `CourseDetailPage`

- Current role: course previews, listing cards, detail page.
- Preserve: props, localized fields, price/token calculations, image fallback, add-to-cart, links.
- Redesign: Create cohesive product cards and product detail layout.
- Do not break: cart item payload, course slug links, cover image path resolution.

### `TokenPacks`, `PricingPage`, `TopUpPage`

- Current role: token pack display and custom top-up links.
- Preserve: translations, currency, custom amount sanitization, checkout URLs.
- Redesign: Pack comparison, wallet calculator, custom amount form, recommended pack.
- Do not break: query params consumed by checkout.

### `CartContext`, `MiniCart`, `/cart`, `/checkout`

- Current role: local cart state and purchase UI.
- Preserve: localStorage key, cart item shape, item type detection, totals, remove/clear, checkout actions.
- Redesign: Full cart/checkout system surfaces.
- Do not break: `token-pack-*` and `custom-top-up*` slug semantics.

### `TopUpSuccessContent`

- Current role: payment status polling and next actions.
- Preserve: reference ID, status tone logic, polling intervals, session update, cart clearing conditions.
- Redesign: More polished payment result states.
- Do not break: return-to-checkout behavior for course items.

### `LearnPage`, `CustomCourseForm`, `AIStrategyForm`

- Current role: generation forms and token calculators.
- Preserve: all form fields, hidden mappings, pricing functions, API payloads, auth/token checks, URL job handling.
- Redesign: Multi-section workspace with sticky price/status panel and stronger form controls.
- Do not break: tokensCost calculation or languages jobs behavior.

### `DashboardNavigation`

- Current role: dashboard tabs/links with active path.
- Preserve: all dashboard route links and active detection.
- Redesign: More dashboard-native nav, possibly sidebar on desktop and horizontal tabs on mobile.
- Do not break: route names and protected dashboard shell.

### Dashboard pages

- Current role: data-driven account area for balance, library, custom courses, AI strategies, transactions, receipts, settings.
- Preserve: all fetches, filters, status maps, downloads, profile edit, password modal.
- Redesign: Cohesive account workspace with better tables/cards and responsive density.
- Do not break: auth redirects or owner-checked downloads.

### Auth components

- Current role: login, register, forgot, reset, change password.
- Preserve: input fields, validation, API payloads, redirects, toasts.
- Redesign: Shared auth shell with better form grouping and state displays.
- Do not break: callback URLs and security behavior.

### `CookieConsentBanner` and `CookiesPage`

- Current role: consent banner and policy/settings trigger.
- Preserve: localStorage key, cookie key, categories, accept/reject/save, `open-cookie-settings`.
- Redesign: More polished banner/preferences UI and accessible focus flow.
- Do not break: persistence or category semantics.

### `ToastProvider`

- Current role: global portal toasts with variants.
- Preserve: `showToast`, `dismissToast`, variants, duration.
- Redesign: Better visual state, icons, close button, motion if desired.
- Do not break: portal mounting and toast API.

### Legal pages

- Current role: translation-driven legal document components with TOC/content blocks.
- Preserve: content, anchors, block renderers.
- Redesign: Shared document shell, better mobile TOC, tables, notes, warning styles.
- Do not break: route links or legal text.

## 10. Forms and States Redesign

### Inputs

- Use visible labels, helper text, and consistent focus rings.
- Maintain controlled/uncontrolled patterns currently in each component.
- Keep `name`, `id`, `type`, `required`, payload keys, and validation behavior.
- Use larger tap targets on mobile.

### Selects

- Preserve values sent to APIs: e.g. registration country, contact region/topic/language, AI market/timeframe.
- Style selects consistently with custom chevrons if needed, but do not break native behavior.

### Textareas

- Preserve max lengths and required validation.
- Use clearer character/helper copy for goals, notes, contact message.

### Checkboxes and Toggles

- Preserve consent requirements for registration, contact, reset password, custom course, AI strategy, cookie categories.
- Use larger labels and clear required/optional distinction.
- Settings toggles that are not persisted must be marked as local/demo or needs verification before being represented as saved preferences.

### Validation Messages

- Preserve existing RHF/Zod/local validation messages or translations.
- Use consistent error icon/color/text and `aria-describedby`.
- Avoid only changing border color without text.

### Loading States

- Redesign skeletons for course fetch, dashboard tables/lists, checkout, top-up result, auth status.
- Preserve redirect/loading guards.

### Success States

- Redesign success alerts for contact, registration, password reset, checkout, top-up, profile save, password change.
- Preserve toasts and page-level success state logic.

### Error States

- Redesign API/form/network/insufficient-token/payment failed states.
- Preserve exact branching and route decisions.

### Empty States

- Redesign empty course results, empty cart, empty library, empty custom courses, empty AI strategies, empty receipts.
- Include useful CTAs to valid existing routes.
- Remove/verify invalid legacy links such as `/allergens`.

### Disabled States

- Preserve disabled conditions:
  - checkout processing,
  - insufficient tokens,
  - active generation job,
  - missing consents,
  - form submission.
- Disabled buttons must remain visibly disabled and non-clickable.

### Toasts and Alerts

- Preserve toast API.
- Add semantic icons and accessible close buttons.
- Ensure alerts are visually distinct for error/success/warning/info and readable in light/dark sections.

## 11. Responsive Requirements

### Mobile

- 320px minimum layout must not overlap or clip meaningful text.
- Header mobile menu must expose learn routes, auth/register/login or dashboard/top-up/logout, currency selector, and core nav.
- Tables should become stacked cards or horizontally scrollable with obvious affordance.
- Checkout/order summary should stack with payment actions visible.
- Course cards should use stable image dimensions and not resize on hover.
- Forms should be single-column with full-width controls and sticky summaries disabled or converted to inline summaries.
- Legal pages should move TOC above content or use an accessible collapsible TOC.

### Tablet

- Use two-column cards where appropriate.
- Dashboards can use a horizontal nav and two-column KPI/content layout.
- Forms can use two-column field groups only where labels and errors fit.

### Desktop

- Use richer split layouts: hero/product previews, course listing + sidebar, learn form + sticky pricing/status, checkout + sticky summary, dashboard content + side panels.
- Keep reading line lengths around 60-75 characters for article/legal pages.
- Preserve sticky elements only where they do not cover footer or mobile content.

### Large Desktop

- Use max content widths and intentional columns.
- Do not stretch cards/tables into unreadable widths.
- Hero and dashboard layouts may use wider preview panels, but paragraphs must remain constrained.

## 12. Accessibility Requirements

- Maintain or improve color contrast for text, controls, focus rings, warning/success/error states.
- Every input/select/textarea/checkbox must have a visible label or accessible label.
- Use semantic headings in order; do not skip heading levels for styling.
- Preserve `button` for actions and `Link`/`a` for navigation/downloads.
- Header dropdowns, mobile menu, accordions, cookie banner, toasts, and modal must be keyboard accessible.
- Add visible focus states to all interactive controls.
- Use `aria-expanded` on expandable menus/accordions where applicable.
- Use `aria-label` for icon-only buttons such as cart/remove/close.
- Use tables with headers for real tabular data, or cards for mobile.
- Use alt text for images based on course/product content.
- Respect `prefers-reduced-motion` in global motion or animation utilities.
- Do not use ARIA to paper over non-semantic markup when semantic HTML is possible.

## 13. Implementation Constraints

- Preserve TypeScript types and component props where possible.
- Prefer existing local helpers and data contracts over new ad hoc logic.
- Avoid duplicate styling by creating reusable primitives or classes.
- Do not hardcode dynamic values from session, DB, API, cookies, localStorage, translations, or env.
- Do not fake testimonials, videos, course data, dashboard metrics, receipts, balances, or generated PDFs.
- Do not introduce a fake backend or mock APIs.
- Do not delete env vars or config keys.
- Do not change API contracts unless fixing a verified bug.
- Do not change payment provider flow or callback signatures as part of visual redesign.
- Do not change OpenAI/Inngest job logic as part of visual redesign.
- Do not remove education-only or high-risk warnings.
- Preserve i18n translation keys wherever possible. If English UI changes require new or changed keys, update English first. Only touch Arabic files minimally if required to prevent missing-key/runtime errors. Do not perform full Arabic translation work.
- Preserve RTL readiness for Arabic pages.
- Use Lucide icons where icons are needed.
- Use structured parsers/data where possible; avoid string matching unless it already exists and is carefully preserved.
- Keep unrelated dirty worktree changes untouched.
- Keep redesign commits/patches scoped by phase.

## 14. Verification Checklist

### Build and Static Checks

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] No new TypeScript errors.
- [ ] No new lint errors.
- [ ] No hydration warnings from locale/currency/cart changes.

### Routes

- [ ] `/`
- [ ] `/about`
- [ ] `/contact`
- [ ] `/cookies`
- [ ] `/faq`
- [ ] `/glossary`
- [ ] `/pricing`
- [ ] `/privacy`
- [ ] `/refund-policy`
- [ ] `/resources`
- [ ] `/risk-and-disclaimer`
- [ ] `/terms`
- [ ] `/courses`
- [ ] `/courses/[slug]`
- [ ] `/learn`
- [ ] all `/learn/*` subpages
- [ ] `/cart`
- [ ] `/checkout`
- [ ] `/top-up`
- [ ] `/top-up/result`
- [ ] auth routes
- [ ] all dashboard routes
- [ ] not-found behavior needs verification

### Forms

- [ ] Login success/error/loading.
- [ ] Register validation and successful auto sign-in.
- [ ] Forgot password validation and success state.
- [ ] Reset password token missing/error/success states.
- [ ] Change password modal validation and success/error.
- [ ] Contact form validation, consent, API success/error, reset.
- [ ] Custom course form validation, consents, token estimate, insufficient balance, submit.
- [ ] AI strategy form validation, consents, token estimate, insufficient balance, submit.
- [ ] Settings profile edit/save/cancel.

### Auth

- [ ] Protected routes redirect unauthenticated users.
- [ ] `/checkout` redirects to `/login?callbackUrl=/checkout`.
- [ ] Logged-in users redirect away from login/register/forgot/reset as currently implemented.
- [ ] Session balance updates after purchases/top-ups.
- [ ] Logout works from desktop and mobile header.

### Checkout, Payment, Token Balance

- [ ] Course add-to-cart from list and detail.
- [ ] Cart duplicate prevention.
- [ ] Cart remove and empty state.
- [ ] Checkout with course paid by tokens.
- [ ] Checkout insufficient token state.
- [ ] Checkout card/hosted top-up for token packs.
- [ ] Checkout card/hosted top-up for custom amount.
- [ ] Checkout card/hosted top-up for course exact balance flow.
- [ ] `/top-up/result` pending/completed/failed states.
- [ ] Cart clears only in intended top-up-only scenario.
- [ ] Return to checkout after top-up when course items remain.

### Currency and Language

- [ ] Currency switcher updates GBP/EUR/USD/SR display.
- [ ] Token pack/custom top-up values convert correctly.
- [ ] Course cards/details convert correctly.
- [ ] Dashboard/transactions convert correctly.
- [ ] Language switcher updates UI copy.
- [ ] Arabic sets RTL direction and does not break layouts.
- [ ] Course title/description Arabic fallback works.

### AI and Custom Generation

- [ ] Custom course pricing formula preserved.
- [ ] AI strategy pricing formula preserved.
- [ ] Insufficient token handling routes to `/top-up`.
- [ ] Successful generation request returns jobs and URL jobId.
- [ ] Dashboard custom course list shows statuses/downloads.
- [ ] Dashboard AI strategy list shows statuses/downloads by language.
- [ ] Job status UI, if added, matches `/api/custom-course/[id]` and `/api/ai-strategy/[id]` contracts.

### Course Purchase and Library

- [ ] Course list loads DB or static fallback.
- [ ] Course filters/search work.
- [ ] Course detail loads and uses fallback correctly.
- [ ] Course purchase prevents duplicate/handles already purchased.
- [ ] Purchased course appears in dashboard/library.
- [ ] Course PDF download link works.

### Dashboard

- [ ] Dashboard overview fetches data.
- [ ] Library search/filter/downloads.
- [ ] Custom courses search/filter/status/downloads.
- [ ] AI strategies search/filter/status/downloads.
- [ ] Transactions filter and status.
- [ ] Receipts filter/search/download PDF.
- [ ] Settings profile save and password modal.

### Responsive and Accessibility

- [ ] Mobile 320/375/390 widths.
- [ ] Tablet 768/820 widths.
- [ ] Desktop 1280/1440 widths.
- [ ] Large desktop 1728+ widths.
- [ ] Keyboard navigation through header, mobile menu, forms, tabs, accordions, cookie banner, modals.
- [ ] Focus states visible.
- [ ] Contrast passes for primary text, secondary text, buttons, alerts.
- [ ] No text overlap/clipping.
- [ ] Images/videos/widgets have stable dimensions.

## 15. Definition of Done

The redesign is complete when:

- The whole site looks substantially different from the current dark purple/gold glass UI.
- Page structures have changed, not only colors, fonts, radii, shadows, or buttons.
- Homepage, courses, course detail, pricing, cart, checkout, top-up, learn/generation, auth, dashboard, secondary pages, legal pages, header, footer, forms, cards, tables, alerts, toasts, empty/loading/error states are redesigned.
- Shared UI primitives and global styles are redesigned coherently.
- Existing functionality is preserved.
- No dynamic behavior has been replaced with hardcoded content.
- English layouts are fully redesigned and verified. Existing Arabic/i18n infrastructure remains intact, but full Arabic visual/content QA is out of scope for this pass.
- Currency switching works.
- Auth, token balance, checkout, top-up, generation, downloads, receipts, dashboard, and contact flows still work.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass or baseline pre-existing failures are clearly documented.
- Responsive behavior works across mobile, tablet, desktop, and large desktop.
- Accessibility requirements are met.
- Final result feels like a premium modern fintech education product.

## 16. Final Report Format

After the actual redesign implementation, use this report format:

### Summary

- Briefly describe the redesign direction and the major site areas redesigned.

### Files Changed

- List changed files by area: global design system, layout shell, homepage, courses, pricing/checkout, learn/generation, auth, dashboard, secondary/legal pages, shared components.

### Pages Redesigned

- List every route redesigned and note any route intentionally unchanged.

### Functionality Preserved

- Confirm auth, cart, checkout, token balance, top-up, course purchase, custom course, AI strategy, downloads, receipts, dashboard, language, currency, contact, cookie consent.

### Commands Run

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Any dev server/smoke-test commands.

### Remaining Issues

- List known issues, needs-verification items, skipped checks, or follow-up work.

### Files Changed Table

| File | Area | Change Summary | Risk Level | Verification |
| --- | --- | --- | --- | --- |
| `path/to/file` | Example area | Brief summary | Low/Medium/High | Command/manual check |

