// lib/currency-client.ts - Client-side currency utilities

'use client'

import { getAvailableCurrenciesList, getCurrencyConfigByCode } from './currency-config'

const CURRENCY_COOKIE_NAME = 'user_currency'

/**
 * Get user's selected currency from cookie
 */
export function getUserCurrency(): string {
  if (typeof window === 'undefined') return 'GBP'

  try {
    const localCurrency = localStorage.getItem('currency')?.trim().toUpperCase()
    if (localCurrency) {
      return localCurrency
    }
  } catch {}

  const cookies = document.cookie.split(';')
  const currencyCookie = cookies.find((c) => c.trim().startsWith(`${CURRENCY_COOKIE_NAME}=`))
  
  if (currencyCookie) {
    const currency = currencyCookie.split('=')[1]?.trim().toUpperCase()
    if (currency) {
      return currency
    }
  }
  
  return 'GBP'
}

/**
 * Set user's selected currency in localStorage and cookie
 */
export function setUserCurrency(currencyCode: string): boolean {
  if (typeof window === 'undefined') return false

  const cleanCode = String(currencyCode || '').trim().toUpperCase()
  if (!cleanCode) return false

  try {
    localStorage.setItem('currency', cleanCode)
  } catch {}

  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)
  document.cookie = `${CURRENCY_COOKIE_NAME}=${cleanCode}; expires=${expiryDate.toUTCString()}; path=/`
  return true
}

