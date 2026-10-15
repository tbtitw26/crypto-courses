// app/locale-provider.tsx - Client component to keep html lang and dir attributes in sync

'use client'

import { useEffect } from 'react'
import type { Locale } from '@/i18n/config'

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    if (html.lang !== locale) {
      html.lang = locale
    }
    if (html.dir !== 'ltr') {
      html.dir = 'ltr'
    }
  }, [locale])

  return <>{children}</>
}
