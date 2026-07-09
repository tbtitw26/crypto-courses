#!/usr/bin/env node
// scripts/check-env.js - Environment variables validation script

const requiredEnvVars = {
  // Database
  DATABASE_URL: 'PostgreSQL connection string (e.g., postgresql://user:pass@host:5432/db?sslmode=require)',
  
  // NextAuth
  NEXTAUTH_SECRET: 'Secret for NextAuth.js (generate with: openssl rand -base64 32)',
  NEXTAUTH_URL: 'Base URL of your application (e.g., https://avenqor.net)',

  // Google OAuth
  GOOGLE_CLIENT_ID: 'Google OAuth Client ID from Google Cloud Console',
  GOOGLE_CLIENT_SECRET: 'Google OAuth Client Secret from Google Cloud Console',
  
  // OpenAI
  OPENAI_API_KEY: 'OpenAI API key for GPT-4o and DALL-E 3',
  
  // Payments: no external gateway is wired up, top-ups settle in test mode

  // TransferMit Payment Gateway (legacy)
  TM_API_KEY: 'TransferMit API key',
  TM_SIGNING_KEY: 'TransferMit signing key for webhook verification',
  
  // SMTP Email
  SMTP_HOST: 'SMTP server hostname',
  SMTP_PORT: 'SMTP server port (usually 465 or 587)',
  SMTP_USER: 'SMTP username/email',
  SMTP_PASS: 'SMTP password',
  SMTP_FROM: 'From email address',
  SMTP_FROM_NAME: 'From name (optional, defaults to "RecipeGen Support")',
  
  // Optional
  SITE_BASE_URL: 'Base URL for the site (optional, defaults to NEXTAUTH_URL)',
  TM_API_URL: 'TransferMit API URL (optional, has default)',
  PUPPETEER_EXECUTABLE_PATH: 'Path to Chromium executable (optional, for local dev)',
}

const optionalEnvVars = [
  'SITE_BASE_URL',
  'TM_API_URL',
  'TM_API_KEY',
  'TM_SIGNING_KEY',
  'PUPPETEER_EXECUTABLE_PATH',
  'SMTP_FROM_NAME',
]

function checkEnv() {
  const missing = []
  const warnings = []
  
  console.log('🔍 Checking environment variables...\n')
  
  // Check required variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (optionalEnvVars.includes(key)) {
      continue // Skip optional vars in required check
    }
    
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push({ key, description })
    }
  }
  
  // Check optional but recommended
  for (const key of optionalEnvVars) {
    if (requiredEnvVars[key] && !process.env[key]) {
      warnings.push({ key, description: requiredEnvVars[key] })
    }
  }
  
  // Display results
  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ All required environment variables are set!\n')
    return true
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:\n')
    missing.forEach(({ key, description }) => {
      console.log(`  • ${key}`)
      console.log(`    ${description}\n`)
    })
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Optional environment variables (recommended):\n')
    warnings.forEach(({ key, description }) => {
      console.log(`  • ${key}`)
      console.log(`    ${description}\n`)
    })
  }
  
  // Validation checks
  console.log('🔎 Running validation checks...\n')
  
  // Check NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    console.log('⚠️  Warning: NEXTAUTH_SECRET should be at least 32 characters long\n')
  }
  
  // Check DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
    console.log('⚠️  Warning: DATABASE_URL should start with "postgresql://" or "postgres://"\n')
  }
  
  // Check NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL)
    } catch {
      console.log('⚠️  Warning: NEXTAUTH_URL should be a valid URL\n')
    }
  }
  
  // Check SMTP_PORT is a number
  if (process.env.SMTP_PORT && isNaN(parseInt(process.env.SMTP_PORT))) {
    console.log('⚠️  Warning: SMTP_PORT should be a number\n')
  }
  
  return missing.length === 0
}

// Run check
const isValid = checkEnv()

if (!isValid) {
  console.log('\n📝 Next steps:')
  console.log('1. Copy .env.example to .env')
  console.log('2. Fill in all required variables')
  console.log('3. Run this script again to verify\n')
  process.exit(1)
} else {
  console.log('✅ Environment is ready for deployment!\n')
  process.exit(0)
}
