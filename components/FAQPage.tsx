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
      {/* Dark support hero */}
      <section className="bg-surface-900 pb-10 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {t('breadcrumb.home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.faq')}</span>
          </div>

          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
              <HelpCircle className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{t('hero.title')}</h1>
              <p className="mt-1 max-w-lg text-sm text-surface-400">{t('hero.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs text-surface-400 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>{t('hero.bullets.courses')}</span>
            </div>
            <div className="flex items-start gap-2">
              <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>{t('hero.bullets.ai')}</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>{t('hero.bullets.noSignals')}</span>
            </div>
          </div>

          {/* Search bar embedded in hero */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-surface-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                      ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                      : 'border-surface-700 text-surface-400 hover:border-surface-600 hover:text-surface-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Risk side note */}
      <section className="border-b border-surface-200 bg-gold-50 py-4">
        <div className="mx-auto flex max-w-page items-center gap-3 px-4 sm:px-6 lg:px-8">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold-600" />
          <p className="flex-1 text-xs text-text-secondary">
            {t('hero.sideCard.paragraph1')}{' '}
            <Link href="/risk-and-disclaimer" className="font-medium text-brand-600 underline underline-offset-2 transition hover:text-brand-700">
              {t('hero.sideCard.cta')}
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
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
            <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card">
              <div className="divide-y divide-surface-100">
                {filteredItems.map((item) => {
                  const globalIdx = getGlobalIndex(item)
                  const isOpen = openItems.has(globalIdx)
                  return (
                    <div key={globalIdx}>
                      <button
                        type="button"
                        onClick={() => toggleItem(globalIdx)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-50"
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
                        <div className="border-t border-surface-100 bg-surface-50 px-5 py-4">
                          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Support info cards */}
      <section className="border-t border-surface-200 bg-white py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('tokensCard.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('tokensCard.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('tokensCard.description')}</p>
              <Link
                href="/pricing"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                {t('tokensCard.cta')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
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

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('deliveryCard.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('deliveryCard.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('deliveryCard.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-card md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold">
                {t('cta.contact')}
              </Link>
              <Link href="/" className="btn-secondary rounded-lg px-5 py-2.5 text-sm">
                {t('cta.backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
