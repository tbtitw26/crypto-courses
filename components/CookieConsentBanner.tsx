'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, SlidersHorizontal } from 'lucide-react'

type ConsentCategories = {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

type ConsentState = {
  categories: ConsentCategories
  updatedAt: string
}

const STORAGE_KEY = 'avenqor_cookie_consent_state'
const COOKIE_KEY = 'avenqor_cookie_consent_state'

const defaultCategories: ConsentCategories = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
}

const defaultState: ConsentState = {
  categories: defaultCategories,
  updatedAt: '',
}

function readStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (!parsed.categories) return null
    return {
      categories: {
        necessary: true,
        functional: !!parsed.categories.functional,
        analytics: !!parsed.categories.analytics,
        marketing: !!parsed.categories.marketing,
      },
      updatedAt: parsed.updatedAt ?? '',
    }
  } catch {
    return null
  }
}

function persistConsent(state: ConsentState) {
  if (typeof window === 'undefined') return
  const payload = JSON.stringify(state)
  window.localStorage.setItem(STORAGE_KEY, payload)
  const maxAge = 60 * 60 * 24 * 365 // 1 year
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(payload)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function CookieConsentBanner() {
  const t = useTranslations('cookies.banner')
  const preferences = t.raw('preferences') as any
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [consent, setConsent] = useState<ConsentState>(defaultState)
  const [draft, setDraft] = useState<ConsentState>(defaultState)

  useEffect(() => {
    setIsMounted(true)
    const saved = readStoredConsent()
    if (saved) {
      setConsent(saved)
      setDraft(saved)
    } else {
      setIsVisible(true)
    }
  }, [])

  const updateState = (state: ConsentState) => {
    setConsent(state)
    setDraft(state)
    persistConsent(state)
  }

  const handleAcceptAll = () => {
    const next: ConsentState = {
      categories: {
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
      },
      updatedAt: new Date().toISOString(),
    }
    updateState(next)
    setIsVisible(false)
    setShowPreferences(false)
  }

  const handleReject = () => {
    const next: ConsentState = {
      categories: {
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      },
      updatedAt: new Date().toISOString(),
    }
    updateState(next)
    setIsVisible(false)
    setShowPreferences(false)
  }

  const handleSave = () => {
    const next: ConsentState = {
      categories: {
        necessary: true,
        functional: draft.categories.functional,
        analytics: draft.categories.analytics,
        marketing: draft.categories.marketing,
      },
      updatedAt: new Date().toISOString(),
    }
    updateState(next)
    setIsVisible(false)
    setShowPreferences(false)
  }

  const toggleCategory = (key: keyof ConsentCategories) => {
    if (key === 'necessary') return
    setDraft((prev) => ({
      categories: { ...prev.categories, [key]: !prev.categories[key] },
      updatedAt: prev.updatedAt,
    }))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      setIsVisible(true)
      setShowPreferences(true)
    }
    window.addEventListener('open-cookie-settings', handler)
    return () => {
      window.removeEventListener('open-cookie-settings', handler)
    }
  }, [])

  if (!isMounted) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-[1200] px-4"
        >
          <div className="pointer-events-auto mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-100">
                    <ShieldCheck className="w-4 h-4 text-cyan-300" />
                    <h3 className="text-sm font-semibold">{t('title')}</h3>
                  </div>
                  <p className="text-sm text-slate-300/90 sm:max-w-2xl">{t('description')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="rounded-full bg-cyan-400/90 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    {t('actions.acceptAll')}
                  </button>
                  <button
                    onClick={handleReject}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500"
                  >
                    {t('actions.rejectNonEssential')}
                  </button>
                  <button
                    onClick={() => setShowPreferences((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-500"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {t('actions.manage')}
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {showPreferences && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-100">{t('preferences.title')}</p>
                      <p className="text-sm text-slate-400">{t('preferences.description')}</p>
                      {consent.updatedAt && (
                        <p className="text-[11px] text-slate-500">
                          {t('preferences.lastUpdated')}: {new Date(consent.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {Object.entries(preferences.categories).map(([key, value]) => {
                        const categoryValue = value as { title: string; description: string }
                        return (
                          <label
                            key={key}
                            className={`flex h-full cursor-pointer flex-col gap-2 rounded-2xl border p-3 ${
                              key === 'necessary' ? 'border-slate-700 bg-slate-900/60' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-100">{categoryValue.title}</span>
                              <input
                                type="checkbox"
                                checked={draft.categories[key as keyof ConsentCategories]}
                                disabled={key === 'necessary'}
                                onChange={() => toggleCategory(key as keyof ConsentCategories)}
                                className="h-4 w-4 cursor-pointer accent-cyan-400 disabled:cursor-not-allowed"
                              />
                            </div>
                            <p className="text-sm text-slate-400">{categoryValue.description}</p>
                          </label>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                      <Link href="/cookies" className="inline-flex items-center gap-1 text-cyan-300 underline decoration-dotted hover:text-cyan-200">
                        {t('footer.text')} · {t('footer.linkLabel')}
                      </Link>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="rounded-full bg-cyan-400/90 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                          {t('actions.save')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

