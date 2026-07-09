// app/locale-provider.tsx - Client component to set html lang and dir attributes

'use client'

import { useEffect } from 'react'

const defaultLocale = 'en'

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    if (html.lang !== defaultLocale) {
      html.lang = defaultLocale
    }
    if (html.dir !== 'ltr') {
      html.dir = 'ltr'
    }
  }, [])

  return <>{children}</>
}
