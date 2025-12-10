// lib/config.ts - Configuration constants

function resolveSupabaseStorageFlag(): boolean {
  const explicit = process.env.USE_SUPABASE_STORAGE
  if (explicit === 'true') return true
  if (explicit === 'false') return false
  const hasCreds = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  return hasCreds
}

const useSupabaseStorage = resolveSupabaseStorageFlag()

const supabaseBuckets = {
  coursePdf: process.env.SUPABASE_BUCKET_COURSE_PDF || 'course-pdf',
  courseImages: process.env.SUPABASE_BUCKET_COURSE_IMAGES || 'course-images',
  courseMedia: process.env.SUPABASE_BUCKET_COURSE_MEDIA || 'course-madia',
}

const supabaseSignedUrlTtlPdf = parseInt(process.env.SUPABASE_SIGNED_URL_TTL_PDF || '86400', 10)

export const config = {
  site: {
    baseUrl: process.env.SITE_BASE_URL || 'http://localhost:3000',
    name: 'Avenqor',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    useStorage: useSupabaseStorage,
    buckets: supabaseBuckets,
    signedUrlTtl: {
      pdf: Number.isNaN(supabaseSignedUrlTtlPdf) ? 86400 : supabaseSignedUrlTtlPdf,
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    // Models configuration
    models: {
      // Text generation models
      // Using GPT-4o mini: $0.15/M input, $0.60/M output (cost-efficient)
      strategy: process.env.OPENAI_STRATEGY_MODEL || 'gpt-4o-mini', // For AI Strategy
      // Using GPT-4o for regular course generation: more powerful, better at following instructions
      // GPT-4o: $2.50/M input, $10.00/M output (higher cost but better quality and efficiency)
      course: process.env.OPENAI_COURSE_MODEL || 'gpt-4o', // For regular course generation (scripts)
      // Using GPT-4.1-mini for Custom Course: 32K output tokens (vs 16K for gpt-4o)
      // GPT-4.1-mini: $0.40/M input, $1.60/M output (cost-efficient with higher token limit)
      customCourse: process.env.OPENAI_CUSTOM_COURSE_MODEL || 'gpt-4.1-mini', // For Custom Course generation
      // Image generation models
      // Using GPT Image 1 mini: Cost-efficient version of GPT Image 1
      image: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini', // For image generation
    },
    // Generation settings
    settings: {
      strategy: {
        temperature: 0.7, // Balanced for creative but structured output
        maxTokens: 16384, // GPT-4o mini supports up to 16K output tokens
      },
      course: {
        temperature: 0.3, // Lower temperature for structured JSON output
        maxTokens: 16384, // GPT-4o supports up to 16K output tokens for structured outputs
      },
      customCourse: {
        temperature: 0.3, // Lower temperature for structured JSON output
        maxTokens: 32768, // GPT-4.1-mini supports up to 32K output tokens (double the limit of gpt-4o)
      },
      image: {
        size: '1024x1024', // GPT Image 1 mini: '1024x1024', '1024x1536', '1536x1024', 'auto'
        quality: 'medium', // GPT Image 1 mini: 'low', 'medium', 'high', 'auto'
        n: 1,
      },
    },
      // Timeouts (in milliseconds)
      timeouts: {
        strategy: 90000, // 90 seconds for AI Strategy generation (reduce aborts)
        course: 1200000, // 1200 seconds (20 minutes) - increased for complex courses that may take longer
        translation: 2700000, // 2700 seconds (45 minutes) - translation can take longer for very large courses (80+ KB)
        image: 120000, // 120 seconds (2 minutes) - image generation can take time
        pdf: 300000, // 300 seconds (5 minutes) - increased for large HTML with base64 images
      },
  },
  transfermit: {
    apiUrl: process.env.TM_API_URL || 'https://app.transfermit.com/api/v1',
    apiKey: process.env.TM_API_KEY || '',
    signingKey: process.env.TM_SIGNING_KEY || '',
  },
  nextauth: {
    secret: process.env.NEXTAUTH_SECRET || '',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  smtp: {
    // For Hostinger: use 'smtp.hostinger.com' or 'smtp.titan.email' (if using Titan Email)
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
    fromName: process.env.SMTP_FROM_NAME || 'Avenqor Support',
  },
  // Browserless.io for remote Chrome (PDF generation in serverless)
  browserless: {
    apiKey: process.env.BROWSERLESS_API_KEY || '',
    // Free tier: 1000 units/month, plenty for 1-3 PDFs/week
    endpoint: process.env.BROWSERLESS_ENDPOINT || 'wss://chrome.browserless.io',
  },
  generation: {
    cost: 60.0, // Tokens per generation
  },
} as const

