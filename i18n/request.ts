// i18n/request.ts - i18n configuration for next-intl

import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config'
import { getMessages } from './messages'

export { locales, defaultLocale, type Locale } from './config'

export default getRequestConfig(async ({ locale }) => {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value
  const validLocale: Locale = isLocale(locale) ? locale : isLocale(cookieLocale) ? cookieLocale : defaultLocale

  return {
    locale: validLocale,
    messages: await getMessages(validLocale),
  }
})
