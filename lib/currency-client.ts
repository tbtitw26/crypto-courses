// lib/currency-client.ts - Client-side currency utilities

'use client'

import { SITE_CURRENCY } from './currency-config'

/**
 * Currency used for all prices shown to the user.
 * The site shows and charges a single currency; previously stored choices are ignored.
 */
export function getUserCurrency(): string {
  return SITE_CURRENCY
}
