// components/LanguageSelector.tsx - Language selector component

'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { locales, localeLabels, LOCALE_COOKIE, type Locale } from '@/i18n/config'

function useChangeLocale() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const changeLocale = (code: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  return { changeLocale, isPending }
}

export function LanguageSelector() {
  const tMenu = useTranslations('common.menu')
  const currentLocale = useLocale() as Locale
  const { changeLocale, isPending } = useChangeLocale()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleLocaleChange = (code: Locale) => {
    setIsOpen(false)
    if (code !== currentLocale) changeLocale(code)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        aria-label={tMenu('language')}
        className="inline-flex items-center gap-1 rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-surface-400 hover:text-text-main disabled:opacity-60"
      >
        <span>{localeLabels[currentLocale].short}</span>
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-surface-300 bg-white p-1 shadow-card z-50">
          {locales.map((code) => (
            <button
              key={code}
              onClick={() => handleLocaleChange(code)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                code === currentLocale
                  ? 'bg-brand-50 font-semibold text-brand-800'
                  : 'text-text-secondary hover:bg-surface-100 hover:text-text-main'
              }`}
            >
              <span>{localeLabels[code].flag}</span>
              <span>{localeLabels[code].name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function LanguageSelectorMobile() {
  const tMenu = useTranslations('common.menu')
  const currentLocale = useLocale() as Locale
  const { changeLocale, isPending } = useChangeLocale()

  return (
    <div>
      <p className="px-2 text-xs font-bold uppercase tracking-wide text-text-muted mb-2">{tMenu('language')}</p>
      <div className="flex gap-1.5">
        {locales.map((code) => (
          <button
            key={code}
            disabled={isPending}
            onClick={() => code !== currentLocale && changeLocale(code)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              code === currentLocale
                ? 'bg-brand-700 text-white'
                : 'border border-surface-300 bg-white text-text-secondary hover:bg-surface-100'
            }`}
          >
            <span>{localeLabels[code].flag}</span>
            <span>{localeLabels[code].short}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
