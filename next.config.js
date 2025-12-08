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
]

if (SUPABASE_HOSTNAME) {
  remotePatterns.push({
    protocol: 'https',
    hostname: SUPABASE_HOSTNAME,
  })
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
  // Для Puppeteer/Chromium в serverless функциях
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('puppeteer')
    }
    return config
  },
}

module.exports = nextConfig

