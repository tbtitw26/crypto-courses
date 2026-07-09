'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/ToastProvider'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { NextIntlClientProvider } from 'next-intl'
import { CartProvider } from '@/contexts/CartContext'

// Static import for default locale to avoid loading issues
import enCommon from '@/i18n/en/common.json'
import enHome from '@/i18n/en/home.json'
import enCourses from '@/i18n/en/courses.json'
import enCart from '@/i18n/en/cart.json'
import enLearn from '@/i18n/en/learn.json'
import enPricing from '@/i18n/en/pricing.json'
import enDashboard from '@/i18n/en/dashboard.json'
import enAuth from '@/i18n/en/auth.json'
import enFaq from '@/i18n/en/faq.json'
import enGlossary from '@/i18n/en/glossary.json'
import enResources from '@/i18n/en/resources.json'
import enAbout from '@/i18n/en/about.json'
import enContact from '@/i18n/en/contact.json'
import enTerms from '@/i18n/en/terms.json'
import enPrivacy from '@/i18n/en/privacy.json'
import enCookies from '@/i18n/en/cookies.json'
import enRisk from '@/i18n/en/risk.json'
import enTopUp from '@/i18n/en/topUp.json'
import enRefund from '@/i18n/en/refund.json'

const defaultLocale = 'en'

// Default messages available immediately
const defaultMessages = {
  common: enCommon,
  home: enHome,
  courses: enCourses,
  cart: enCart,
  learn: enLearn,
  pricing: enPricing,
  dashboard: enDashboard,
  auth: enAuth,
  faq: enFaq,
  glossary: enGlossary,
  resources: enResources,
  about: enAbout,
  contact: enContact,
  terms: enTerms,
  privacy: enPrivacy,
  cookies: enCookies,
  risk: enRisk,
  topUp: enTopUp,
  refund: enRefund,
}

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = defaultLocale
  const messages = defaultMessages

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

