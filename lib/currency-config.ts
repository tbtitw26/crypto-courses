// currency-config.ts - Multi-currency configuration

export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  flag: string
  flag_icon: string
  rate: number // Exchange rate relative to GBP
  tokens_per_unit: number
  is_default: boolean
}

/** The only currency shown and charged on the site. GBP stays the internal pricing base (100 Usage Units = 1.00 GBP). */
export const SITE_CURRENCY = 'EUR'

export const currencies: Record<string, CurrencyConfig> = {
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    flag_icon: '/assets/images/flags/gb.svg',
    rate: 1.0, // Base currency
    tokens_per_unit: 100, // 100 tokens per 1 GBP
    is_default: true,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    flag_icon: '/assets/images/flags/eu.svg',
    rate: 1.14, // 1.00 GBP = 1.14 EUR
    tokens_per_unit: 100, // 100 tokens still based on GBP equivalent
    is_default: false,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    flag_icon: '/assets/images/flags/gb.svg', // TODO: Add USD flag icon
    rate: 1.32, // 1.00 GBP = 1.32 USD
    tokens_per_unit: 100, // 100 tokens still based on GBP equivalent
    is_default: false,
  },
}

export function getAvailableCurrencies(): Record<string, CurrencyConfig> {
  return { [SITE_CURRENCY]: currencies[SITE_CURRENCY] }
}

export function getCurrencyConfig(code: string): CurrencyConfig {
  return currencies[code] || currencies[SITE_CURRENCY]
}

/**
 * Get currency configuration by code (alias for getCurrencyConfig)
 * @param code Currency code (e.g., 'GBP', 'EUR')
 * @returns CurrencyConfig object
 */
export function getCurrencyConfigByCode(code: string): CurrencyConfig {
  return getCurrencyConfig(code)
}

/**
 * Get all available currencies as a list (alias for getAvailableCurrencies)
 * @returns Record of all available currencies
 */
export function getAvailableCurrenciesList(): Record<string, CurrencyConfig> {
  return getAvailableCurrencies()
}

