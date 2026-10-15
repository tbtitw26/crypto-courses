import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Providers } from './providers'
import { LocaleProvider } from './locale-provider'
import { cookies } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE } from '@/i18n/config'
import { getMessages } from '@/i18n/messages'
import { getServerLocale, getServerTranslator } from '@/i18n/server'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator()
  const locale = getServerLocale()
  return {
  title: {
    default: 'Cur Nova',
    template: '%s | Cur Nova',
  },
  description: t('common.meta.description'),
  keywords: ['Cur Nova', 'Forex', 'Crypto', 'Binary options', 'Trading education'],
  authors: [{ name: 'Cur Nova Team' }],
  creator: 'Cur Nova',
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
    locale: locale === 'no' ? 'nb_NO' : 'en_US',
    url: 'https://cur-nova.com',
    siteName: 'Cur Nova',
    title: 'Cur Nova',
    description: t('common.meta.ogDescription'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cur Nova',
    description: t('common.meta.ogDescription'),
  },
  robots: {
    index: true,
    follow: true,
  },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale
  const messages = await getMessages(locale)

  return (
    <html lang={locale} dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} flex min-h-screen flex-col font-body antialiased`}>
        <LocaleProvider locale={locale}>
          <Providers locale={locale} messages={messages}>
            <Header />
            <main className="flex-1 min-w-0">{children}</main>
            <Footer />
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  )
}
