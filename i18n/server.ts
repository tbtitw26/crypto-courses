// i18n/server.ts - Locale-aware translator for Server Components and metadata

import { cookies } from 'next/headers'
import { createTranslator } from 'next-intl'
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config'
import { getMessages } from './messages'

export function getServerLocale(): Locale {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale
}

export async function getServerTranslator() {
  const locale = getServerLocale()
  const messages = await getMessages(locale)
  return createTranslator({ locale, messages })
}
