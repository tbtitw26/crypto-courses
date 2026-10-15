'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/ToastProvider'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { NextIntlClientProvider } from 'next-intl'
import { CartProvider } from '@/contexts/CartContext'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'

export function Providers({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: Messages
  children: React.ReactNode
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <SessionProvider>
        <CartProvider>
          <ToastProvider>
            {children}
            <CookieConsentBanner />
          </ToastProvider>
        </CartProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  )
}

