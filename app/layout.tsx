import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Providers } from './providers'
import { LocaleProvider } from './locale-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: {
    default: 'Avenqor',
    template: '%s | Avenqor',
  },
  description: 'Avenqor - Premium education for high-risk markets. Structured Forex, Crypto and Binary options courses.',
  keywords: ['Avenqor', 'Forex', 'Crypto', 'Binary options', 'Trading education'],
  authors: [{ name: 'Avenqor Team' }],
  creator: 'Avenqor',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://avenqor.net',
    siteName: 'Avenqor',
    title: 'Avenqor',
    description: 'Premium education for high-risk markets. Structured Forex, Crypto and Binary options courses.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avenqor',
    description: 'Premium education for high-risk markets. Structured Forex, Crypto and Binary options courses.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} flex min-h-screen flex-col font-body antialiased`}>
        <LocaleProvider>
          <Providers>
            <Header />
            <main className="flex-1 min-w-0">{children}</main>
            <Footer />
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  )
}
