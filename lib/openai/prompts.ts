// lib/openai/prompts.ts - System prompts and prompt builders

import { config } from '@/lib/config'

/**
 * Compact System Prompt for Course and Strategy generation (2-3 pages max)
 * Supports both English (en) and Arabic (ar) languages
 */
export function buildSystemMessageCompact(language: 'en' | 'ar' = 'en'): string {
  const languageName = language === 'ar' ? 'Modern Standard Arabic' : 'English'
  const rtlNote = language === 'ar' 
    ? '\n- Note for PDF renderer: Arabic content is RTL; ensure `direction: rtl` and right alignment when rendering.'
    : ''

  return `You are a senior course architect for Avenqor (avenqor.net), an education-only platform covering high-risk trading markets (Forex, Crypto, Binary options).
You produce print-friendly PDF manuscripts tailored to individual user profiles.

NON-NEGOTIABLE COMPLIANCE RULES:
- Education only. Not financial advice. Not investment advice.
- No promises, no performance claims, no hype, no "easy money".
- No real-time calls. No "buy now / sell now". No live price targets.
- Always frame trading as high risk with possibility of total loss.
- Examples must be hypothetical and timeless.

STYLE RULES (HARD):
- Calm mentor tone: serious, structured, approachable.
- Minimal jargon; define jargon immediately in plain language.
- Prefer bullet points/checklists over paragraphs.
- NO redundancy. If a point is said once, do not repeat it.
- No emojis, no memes, no slang.
- No external links.

LANGUAGE:
- Write in: ${language} (${languageName}).
${language === 'ar' ? '- Use Modern Standard Arabic. Keep sentences short. Avoid English terms unless unavoidable; if used, explain in Arabic.' : ''}${rtlNote}

HARD LENGTH TARGET (ABSOLUTE):
- Output must fit a 2–3 page A4 PDF in 10–11pt font with normal margins.
- Prefer ~900–1,300 words total (English). For Arabic, keep similarly compact.
- If your draft is too long, cut content by removing details, not by breaking the schema.

STRUCTURE TARGET (MAX):
- 1 short overview paragraph (≤ 90 words).
- 3 core sections (bullets, not essays).
- 1 risk management block (checklist).
- 7-day action plan (7 lines, 1–2 sentences each).
- Micro-glossary (max 6 terms, 1 line each).
- Disclaimer (2–4 lines).

OUTPUT RULES:
- Output MUST match the provided JSON schema exactly (Structured Outputs).
- Make the manuscript PDF-ready: each section should be usable as-is by a renderer.
- Do NOT include external links.
- IMPORTANT: In toc.entries, every entry MUST have a 'children' array. Use empty array [] if no children.`
}

// Build user prompt for Custom Course (Compact 2-3 pages)
export function buildCustomCoursePrompt(params: {
  experienceYears: string
  depositBudget: string
  riskTolerance: string
  markets: string[]
  tradingStyle: string
  timeCommitment?: string
  goalsFreeText: string
  additionalNotes?: string
  languages?: string[] // Changed from language?: string to languages?: string[] (optional for backward compatibility)
  courseId: string
}): string {
  const {
    experienceYears,
    depositBudget,
    riskTolerance,
    markets,
    tradingStyle,
    timeCommitment,
    goalsFreeText,
    additionalNotes,
    courseId,
  } = params

  // Determine level based on experience
  let level = 'Beginner'
  if (experienceYears === '1-2') {
    level = 'Intermediate'
  } else if (experienceYears === '3+') {
    level = 'Advanced'
  }

  // Get language from params (default to 'en')
  const language = params.languages?.[0] || 'en'

  return `Generate a COMPACT custom course manuscript (2–3 pages max) for Avenqor.

LANGUAGE: ${language}  (en|ar)

USER PROFILE:
Experience: ${experienceYears}
Deposit budget: ${depositBudget}
Risk tolerance: ${riskTolerance}
Markets: ${markets.join(', ')}
Trading style: ${tradingStyle}
${timeCommitment ? `Time commitment: ${timeCommitment}` : ''}
Main objective: ${goalsFreeText}
${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}

HARD REQUIREMENTS (DO NOT BREAK):
- Keep total content within 2–3 pages when rendered.
- Use bullets/checklists. Avoid long paragraphs.
- Provide ONLY timeless, educational examples (no real-time prices, no "signals").
- Focus on: ${markets.join(', ')} and the user's goal.
- Emphasize risk management appropriate to ${riskTolerance}.

CONTENT BLUEPRINT (FOLLOW EXACTLY IN YOUR SCHEMA):
- Title + short subtitle (≤ 12 words)
- Overview (≤ 90 words)
- Section 1: Foundations relevant to the user (6–8 bullets)
- Section 2: A simple decision framework (6–8 bullets)
- Section 3: Common mistakes + how to avoid (6–8 bullets)
- Risk Management Checklist (6–8 items)
- 7-Day Action Plan (Day 1..7, 1–2 sentences each)
- Micro Glossary (max 6 terms)
- Disclaimer (2–4 lines)

COURSE ID: ${courseId}
LEVEL: ${level}

Now generate the manuscript in the required JSON schema.`
}

// Build user prompt for AI Strategy (Compact 2-3 pages)
export function buildAIStrategyPrompt(params: {
  experienceYears: string
  depositBudget: string
  riskTolerance: string
  markets: string[]
  tradingStyle: string
  timeCommitment?: string
  mainObjective: string
  market?: string
  timeframe?: string
  riskPerTrade?: string
  maxTrades?: string
  instruments?: string
  focus?: string
  detailLevel?: string
  language?: string
  languages?: string[] // Added for consistency with Custom Course
  courseId: string
}): string {
  const {
    experienceYears,
    depositBudget,
    riskTolerance,
    markets,
    tradingStyle,
    timeCommitment,
    mainObjective,
    market,
    timeframe,
    riskPerTrade,
    maxTrades,
    instruments,
    focus,
    courseId,
  } = params

  // Determine level based on experience
  let level = 'Beginner'
  if (experienceYears === '1-2') {
    level = 'Intermediate'
  } else if (experienceYears === '3+') {
    level = 'Advanced'
  }

  // Get language from params (prefer languages array, fallback to language, default to 'en')
  const language = params.languages?.[0] || params.language || 'en'

  return `Generate a COMPACT AI Strategy manuscript (2–3 pages max) for Avenqor.

LANGUAGE: ${language}  (en|ar)

USER PROFILE:
Experience: ${experienceYears}
Deposit budget: ${depositBudget}
Risk tolerance: ${riskTolerance}
Markets: ${markets.join(', ')}
Trading style: ${tradingStyle}
Main objective: ${mainObjective}
${market ? `Main market: ${market}` : ''}
${timeframe ? `Primary timeframe: ${timeframe}` : ''}
${riskPerTrade ? `Risk per trade: ${riskPerTrade}` : ''}
${maxTrades ? `Max trades per day: ${maxTrades}` : ''}
${instruments ? `Instruments: ${instruments}` : ''}

HARD REQUIREMENTS (DO NOT BREAK):
- 2–3 pages max, bullets/checklists only.
- No real-time prices, no "signals", no profit promises.
- Focus on behavior, discipline, and a decision checklist.

CONTENT BLUEPRINT (FOLLOW EXACTLY IN YOUR SCHEMA):
- Strategy title (≤ 10 words) + one-line intent
- Setup rules (6–8 bullets)
- Entry checklist (5–7 bullets)
- Exit + risk rules (5–7 bullets)
- "When NOT to trade" list (5–7 bullets)
- 5-scenario mini-drill (5 items, 1 line each, hypothetical)
- Micro glossary (max 6 terms)
- Disclaimer (2–4 lines)

COURSE ID: ${courseId}
LEVEL: ${level}

Now generate the strategy in the required JSON schema.`
}

