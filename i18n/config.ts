// i18n/config.ts - Shared locale configuration (safe for client and server)

export const locales = ['en', 'no'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const localeLabels: Record<Locale, { short: string; name: string; flag: string }> = {
  en: { short: 'EN', name: 'English', flag: '🇬🇧' },
  no: { short: 'NO', name: 'Norsk', flag: '🇳🇴' },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}
