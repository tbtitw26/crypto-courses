// components/CurrencySelector.tsx - Currency selector component

'use client'

import { useState, useEffect, useRef } from 'react'
import { getAvailableCurrenciesList } from '@/lib/currency-config'
import { getUserCurrency, setUserCurrency } from '@/lib/currency-client'

export function CurrencySelector() {
  const [currentCurrency, setCurrentCurrency] = useState('GBP')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentCurrency(getUserCurrency())
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleCurrencyChange = (code: string) => {
    setUserCurrency(code)
    setCurrentCurrency(code)
    setIsOpen(false)
    // Reload page to apply currency changes
    window.location.reload()
  }

  const allCurrencies = getAvailableCurrenciesList()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-surface-400 hover:text-text-main"
      >
        <span>{currentCurrency}</span>
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-surface-300 bg-white p-1 shadow-card z-50">
          {Object.entries(allCurrencies).map(([code, currency]) => (
            <button
              key={code}
              onClick={() => handleCurrencyChange(code)}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                code === currentCurrency
                  ? 'bg-brand-50 font-semibold text-brand-800'
                  : 'text-text-secondary hover:bg-surface-100 hover:text-text-main'
              }`}
            >
              <span>
                {code} ({currency.symbol})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CurrencySelectorMobile() {
  const [currentCurrency, setCurrentCurrency] = useState('GBP')

  useEffect(() => {
    setCurrentCurrency(getUserCurrency())
  }, [])

  const handleCurrencyChange = (code: string) => {
    setUserCurrency(code)
    setCurrentCurrency(code)
    window.location.reload()
  }

  const allCurrencies = getAvailableCurrenciesList()

  return (
    <div>
      <p className="px-2 text-xs font-bold uppercase tracking-wide text-text-muted mb-2">Currency</p>
      <div className="flex gap-1.5">
        {Object.entries(allCurrencies).map(([code, currency]) => (
          <button
            key={code}
            onClick={() => handleCurrencyChange(code)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              code === currentCurrency
                ? 'bg-brand-700 text-white'
                : 'border border-surface-300 bg-white text-text-secondary hover:bg-surface-100'
            }`}
          >
            <span>{currency.flag}</span>
            <span>{code}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
