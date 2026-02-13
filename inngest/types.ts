// inngest/types.ts - TypeScript types for Inngest event payloads

/**
 * Event payload for custom course generation request
 * Each event represents a single job for a single language
 */
export interface CustomCourseRequestedEvent {
  jobId: number // CustomCourseRequest.id
  userId: number
  language: "en" | "ar" // Single language per job
  requestedAt: string // ISO string
  // Include all input fields needed for generation
  experienceYears: string
  depositBudget: string
  riskTolerance: "low" | "medium" | "high"
  markets: string[]
  tradingStyle: string
  timeCommitment?: string
  goalsFreeText: string
  additionalNotes?: string
  tokensCost: number
  userEmail: string
}

/**
 * Event payload for AI strategy generation request
 * Each event represents a single job for a single language
 */
export interface AIStrategyRequestedEvent {
  jobId: number // AiStrategyRun.id
  userId: number
  language: "en" | "ar" // Single language per job
  requestedAt: string // ISO string
  // Include all input fields needed for generation
  experienceYears: string
  depositBudget: string
  riskTolerance: "low" | "medium" | "high"
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
  detailLevel?: "quick" | "standard" | "deep"
  tokensCost: number
}

/**
 * Event payload for delayed email notification for custom course PDF ready
 * This event is scheduled 48-96 hours after PDF generation
 */
export interface CustomCourseEmailDelayedEvent {
  jobId: number // CustomCourseRequest.id
  userId: number
  language: "en" | "ar"
  userEmail: string
  userName: string
  title: string
}

