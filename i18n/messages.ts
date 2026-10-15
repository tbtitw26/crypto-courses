// i18n/messages.ts - Loads all message namespaces for a locale (server only)

import type { Locale } from './config'

export async function getMessages(locale: Locale) {
  const load = async (ns: string) => (await import(`./${locale}/${ns}.json`)).default

  return {
    common: await load('common'),
    home: await load('home'),
    courses: await load('courses'),
    cart: await load('cart'),
    learn: await load('learn'),
    pricing: await load('pricing'),
    dashboard: await load('dashboard'),
    auth: await load('auth'),
    faq: await load('faq'),
    glossary: await load('glossary'),
    resources: await load('resources'),
    about: await load('about'),
    contact: await load('contact'),
    terms: await load('terms'),
    refund: await load('refund'),
    privacy: await load('privacy'),
    cookies: await load('cookies'),
    risk: await load('risk'),
    topUp: await load('topUp'),
  }
}

export type Messages = Awaited<ReturnType<typeof getMessages>>
