// i18n/request.ts - i18n configuration for next-intl

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

export const locales = ['en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // After validation, we know locale is a valid Locale (which is a string)
  const validLocale = locale as Locale

  return {
    locale: validLocale,
    messages: {
      common: (await import(`./${validLocale}/common.json`)).default,
      home: (await import(`./${validLocale}/home.json`)).default,
      courses: (await import(`./${validLocale}/courses.json`)).default,
      cart: (await import(`./${validLocale}/cart.json`)).default,
      learn: (await import(`./${validLocale}/learn.json`)).default,
      pricing: (await import(`./${validLocale}/pricing.json`)).default,
      dashboard: (await import(`./${validLocale}/dashboard.json`)).default,
      auth: (await import(`./${validLocale}/auth.json`)).default,
      faq: (await import(`./${validLocale}/faq.json`)).default,
      glossary: (await import(`./${validLocale}/glossary.json`)).default,
      resources: (await import(`./${validLocale}/resources.json`)).default,
      about: (await import(`./${validLocale}/about.json`)).default,
      contact: (await import(`./${validLocale}/contact.json`)).default,
      terms: (await import(`./${validLocale}/terms.json`)).default,
      refund: (await import(`./${validLocale}/refund.json`)).default,
      privacy: (await import(`./${validLocale}/privacy.json`)).default,
      cookies: (await import(`./${validLocale}/cookies.json`)).default,
      risk: (await import(`./${validLocale}/risk.json`)).default,
      topUp: (await import(`./${validLocale}/topUp.json`)).default,
    },
  }
})

