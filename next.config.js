/** @type {import('next').NextConfig} */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_HOSTNAME = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null

const remotePatterns = [
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '3000',
  },
  {
    protocol: 'https',
    hostname: '**.vercel.app',
  },
  {
    protocol: 'https',
    hostname: 'oaidalleapiprodscus.blob.core.windows.net', // OpenAI DALL-E images
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
]

if (SUPABASE_HOSTNAME) {
  remotePatterns.push({
    protocol: 'https',
    hostname: SUPABASE_HOSTNAME,
  })
}

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns,
  },
  // Note: We use Browserless.io for PDF generation in serverless,
  // so no special Chromium/Puppeteer configuration is needed here.
}

module.exports = nextConfig
