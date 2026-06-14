'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Cpu,
  Wallet,
  CreditCard,
  HelpCircle,
  Info,
  Globe2,
  Clock,
  ArrowRight,
  Search,
  ChevronDown,
} from 'lucide-react'

export function FAQPage() {
  const t = useTranslations('faq')

  const faqItems = (t.raw('faq') as any)?.items as Array<{
    category: string
    question: string
    answer: string
  }>

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const categories = useMemo(() => {
    const cats = new Set(faqItems.map((item) => item.category))
    return ['All', ...Array.from(cats)]
  }, [faqItems])

  const filteredItems = useMemo(() => {
    return faqItems.filter((item, index) => {
      const matchesSearch =
        searchQuery === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [faqItems, searchQuery, selectedCategory])

  const toggleItem = (globalIndex: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(globalIndex)) {
        next.delete(globalIndex)
      } else {
        next.add(globalIndex)
      }
      return next
    })
  }

  const getGlobalIndex = (item: { question: string; category: string }) => {
    return faqItems.findIndex((f) => f.question === item.question && f.category === item.category)
  }

  return (
    <div className="min-h-screen">
      {/* Brand gradient top band */}
      <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

      {/* Light hero with search and categories */}
      <section className="bg-white pb-8 pt-6">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-text-muted">
            <Link href="/" className="transition hover:text-text-secondary">
              {t('breadcrumb.home')}
            </Link>
            <span>/</span>
            <span className="text-text-secondary">{t('breadcrumb.faq')}</span>
          </div>

          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <HelpCircle className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-main sm:text-3xl">{t('hero.title')}</h1>
              <p className="mt-1 max-w-lg text-sm text-text-secondary">{t('hero.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs text-text-secondary sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>{t('hero.bullets.courses')}</span>
            </div>
            <div className="flex items-start gap-2">
              <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>{t('hero.bullets.ai')}</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>{t('hero.bullets.noSignals')}</span>
            </div>
          </div>

          {/* Search bar + category pills + inline risk badge */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full rounded-lg border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-text-main placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 text-text-muted hover:border-surface-300 hover:text-text-secondary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Risk note as inline badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50/60 px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gold-600" />
            <p className="text-[11px] text-text-secondary">
              {t('hero.sideCard.paragraph1')}{' '}
              <Link href="/risk-and-disclaimer" className="font-medium text-brand-600 underline underline-offset-2 transition hover:text-brand-700">
                {t('hero.sideCard.cta')}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ accordion — individual cards */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-main sm:text-xl">{t('faq.title')}</h2>
              <p className="mt-1 max-w-xl text-sm sm:text-base text-text-secondary">{t('faq.subtitle')}</p>
            </div>
            <span className="hidden items-center gap-1 text-xs text-text-muted sm:inline-flex">
              <Info className="h-3 w-3 text-brand-600" />
              {t('faq.disclaimer')}
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-surface-200 bg-white p-12 text-center shadow-card">
              <HelpCircle className="mx-auto mb-3 h-8 w-8 text-surface-300" />
              <p className="text-sm text-text-muted">No questions match your search.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
                className="mt-3 text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredItems.map((item) => {
                const globalIdx = getGlobalIndex(item)
                const isOpen = openItems.has(globalIdx)
                return (
                  <div
                    key={globalIdx}
                    className={`rounded-xl border bg-white shadow-sm transition-shadow ${
                      isOpen ? 'border-brand-200 shadow-md' : 'border-surface-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(globalIdx)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-50 rounded-xl"
                    >
                      <span className="shrink-0 rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                        {item.category}
                      </span>
                      <span className="flex-1 text-sm font-medium text-text-main">{item.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-surface-100 px-5 py-4">
                        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">{item.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Support info cards — featured + stacked layout */}
      <section className="border-t border-surface-200 bg-white py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            {/* Featured card (larger, left) */}
            <div className="rounded-xl border border-surface-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                  <Wallet className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-sm font-semibold text-text-main">{t('tokensCard.title')}</h3>
              </div>
              <p className="mb-1.5 text-xs font-medium text-text-muted">{t('tokensCard.subtitle')}</p>
              <p className="text-sm leading-relaxed text-text-secondary">{t('tokensCard.description')}</p>
              <Link
                href="/pricing"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                {t('tokensCard.cta')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Stacked cards (right) */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-xl border border-surface-200 bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-600" />
                  <h3 className="text-xs font-semibold text-text-main">{t('paymentsCard.title')}</h3>
                </div>
                <p className="mb-1 text-xs text-text-muted">{t('paymentsCard.subtitle')}</p>
                <p className="text-xs leading-relaxed text-text-secondary">{t('paymentsCard.description')}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
                  <Globe2 className="h-3 w-3 text-brand-600" />
                  {t('paymentsCard.regions')}
                </div>
              </div>

              <div className="flex-1 rounded-xl border border-surface-200 bg-white p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600" />
                  <h3 className="text-xs font-semibold text-text-main">{t('deliveryCard.title')}</h3>
                </div>
                <p className="mb-1 text-xs text-text-muted">{t('deliveryCard.subtitle')}</p>
                <p className="text-xs leading-relaxed text-text-secondary">{t('deliveryCard.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric CTA */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card md:flex">
            <div className="flex-1 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 max-w-md text-sm sm:text-base text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3 border-t border-surface-200 bg-surface-50 px-6 py-4 md:flex-col md:justify-center md:border-l md:border-t-0 md:px-8">
              <Link href="/contact" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
                {t('cta.contact')}
              </Link>
              <Link href="/" className="btn-secondary rounded-lg px-5 py-2.5 text-sm whitespace-nowrap">
                {t('cta.backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
