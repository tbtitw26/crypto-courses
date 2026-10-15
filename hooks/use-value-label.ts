// hooks/use-value-label.ts - Translates stored enum-like values (levels, markets, statuses) for display

import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'

export function useValueLabel() {
  const t = useTranslations('common.values')
  return useCallback((value: string) => (value && t.has(value) ? t(value) : value), [t])
}

/** Localizes API "meta" lines such as "Beginner · Forex" or "1,000 tokens · 10.00 GBP". */
export function useMetaLabel() {
  const valueLabel = useValueLabel()
  return useCallback(
    (meta: string) =>
      meta
        .split(' · ')
        .map((part) =>
          part
            .split(', ')
            .map((word) => {
              const tokens = word.match(/^([\d,.]+) tokens$/)
              return tokens ? `${tokens[1]} ${valueLabel('tokens')}` : valueLabel(word)
            })
            .join(', ')
        )
        .join(' · '),
    [valueLabel]
  )
}

/** BCP 47 locale for Intl date/number formatting. */
export function useIntlLocale() {
  return useLocale() === 'no' ? 'nb-NO' : 'en-US'
}
