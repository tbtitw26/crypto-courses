'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ShieldCheck,
  BookOpenCheck,
  Search,
  Info,
  TrendingUp,
  Waves,
  Activity,
  AlertTriangle,
  Brain,
  Compass,
  Clock,
  Layers,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

interface Term {
  id: string
  label: string
  category: string
  short: string
  explanation: string
  tag?: string
}

export function GlossaryPage() {
  const t = useTranslations('glossary')
  const tBreadcrumb = useTranslations('courses.breadcrumb')
  const tNav = useTranslations('common.nav')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(t('categories.all'))
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)

  const allTerms = (t.raw('terms') as any)?.items as Term[]

  const categoryMap = useMemo(() => {
    return {
      [t('categories.all')]: 'All',
      [t('categories.forex')]: 'Forex',
      [t('categories.crypto')]: 'Crypto',
      [t('categories.binary')]: 'Binary',
      [t('categories.risk')]: 'Risk',
      [t('categories.process')]: 'Process',
      [t('categories.psychology')]: 'Psychology',
    }
  }, [t])

  const categories = useMemo(
    () => [
      t('categories.all'),
      t('categories.forex'),
      t('categories.crypto'),
      t('categories.binary'),
      t('categories.risk'),
      t('categories.process'),
      t('categories.psychology'),
    ],
    [t]
  )

  const filteredTerms = useMemo(() => {
    return allTerms.filter((term) => {
      const matchesSearch =
        searchQuery === '' ||
        term.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.short.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.explanation.toLowerCase().includes(searchQuery.toLowerCase())

      const categoryKey = categoryMap[selectedCategory] || selectedCategory
      const matchesCategory = categoryKey === 'All' || term.category === categoryKey

      return matchesSearch && matchesCategory
    })
  }, [allTerms, searchQuery, selectedCategory, categoryMap])

  const getCategoryIcon = (category: string) => {
    if (category === 'Risk') {
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
    }
    if (category === 'Forex') {
      return <TrendingUp className="h-3.5 w-3.5 text-brand-400" />
    }
    if (category === 'Crypto') {
      return <Waves className="h-3.5 w-3.5 text-brand-400" />
    }
    if (category === 'Binary') {
      return <Activity className="h-3.5 w-3.5 text-brand-400" />
    }
    if (category === 'Process') {
      return <Layers className="h-3.5 w-3.5 text-brand-400" />
    }
    if (category === 'Psychology') {
      return <Brain className="h-3.5 w-3.5 text-brand-400" />
    }
    return null
  }

  const getCategoryLabel = (categoryKey: string): string => {
    const reverseMap: { [key: string]: string } = {
      All: t('categories.all'),
      Forex: t('categories.forex'),
      Crypto: t('categories.crypto'),
      Binary: t('categories.binary'),
      Risk: t('categories.risk'),
      Process: t('categories.process'),
      Psychology: t('categories.psychology'),
    }
    return reverseMap[categoryKey] || categoryKey
  }

  return (
    <div className="min-h-screen">
      {/* Light hero with search + pill filters */}
      <section className="border-b border-surface-200 bg-gradient-to-b from-surface-50 to-white pb-8 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-text-muted">
            <Link href="/" className="transition hover:text-text-secondary">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-text-secondary">{t('breadcrumb.glossary')}</span>
          </div>

          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50">
              <BookOpenCheck className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-main sm:text-3xl">{t('hero.title')}</h1>
              <p className="mt-1 max-w-lg text-sm text-text-secondary">{t('hero.subtitle')}</p>
            </div>
          </div>

          {/* Inline info callout */}
          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <div className="text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-text-main">{t('hero.sideCard.title')}</span>
              <span className="text-text-muted"> — {t('hero.sideCard.subtitle')}</span>
              <span className="ml-1">{t('hero.sideCard.paragraph1')} {t('hero.sideCard.paragraph2')}</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full rounded-full border border-surface-200 bg-white py-3 pl-12 pr-4 text-sm text-text-main shadow-sm placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-surface-400">
              {t('search.info')}
            </span>
          </div>

          {/* Pill category filters */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => {
              const isSelected = cat === selectedCategory
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-surface-100 text-text-secondary hover:bg-surface-200 hover:text-text-main'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Term grid */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-main sm:text-xl">{t('terms.title')}</h2>
              <p className="mt-1 max-w-xl text-sm sm:text-base text-text-secondary">{t('terms.subtitle')}</p>
            </div>
            <span className="hidden items-center gap-1 text-xs text-text-muted sm:inline-flex">
              <Info className="h-3 w-3 text-brand-600" />
              {t('terms.disclaimer')}
            </span>
          </div>

          {filteredTerms.length === 0 ? (
            <div className="rounded-xl border border-surface-200 bg-white p-12 text-center shadow-card">
              <Search className="mx-auto mb-3 h-8 w-8 text-surface-300" />
              <p className="text-sm text-text-muted">{t('search.noResults')}</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(t('categories.all'))
                }}
                className="mt-3 text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredTerms.map((term) => {
                const isExpanded = expandedTerm === term.id
                return (
                  <button
                    type="button"
                    key={term.id}
                    onClick={() => setExpandedTerm(isExpanded ? null : term.id)}
                    aria-expanded={isExpanded}
                    className={`group rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${
                      isExpanded ? 'border-brand-200 ring-1 ring-brand-100' : 'border-surface-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
                        {getCategoryIcon(term.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-main">{term.label}</span>
                          {term.tag && (
                            <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                              {term.tag}
                            </span>
                          )}
                          <ChevronRight
                            className={`ml-auto h-4 w-4 shrink-0 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                        <span className="mt-0.5 block text-[11px] font-medium text-brand-600">
                          {getCategoryLabel(term.category)}
                        </span>
                        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{term.short}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 border-t border-surface-100 pt-4">
                        <p className="text-sm leading-relaxed text-text-secondary">{term.explanation}</p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Info strip — horizontal 3-column */}
      <section className="border-t border-surface-200 bg-white py-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-surface-100 rounded-xl border border-surface-200 bg-surface-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex items-start gap-3 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-text-main">{t('infoCards.education.title')}</h3>
                <p className="mt-0.5 text-[11px] text-text-muted">{t('infoCards.education.subtitle')}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t('infoCards.education.description')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-5">
              <Compass className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-text-main">{t('infoCards.linkFromCourses.title')}</h3>
                <p className="mt-0.5 text-[11px] text-text-muted">{t('infoCards.linkFromCourses.subtitle')}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t('infoCards.linkFromCourses.description')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-text-main">{t('infoCards.updates.title')}</h3>
                <p className="mt-0.5 text-[11px] text-text-muted">{t('infoCards.updates.subtitle')}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t('infoCards.updates.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — asymmetric layout */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-surface-200 bg-white p-6 shadow-card md:grid-cols-5 md:p-8">
            <div className="md:col-span-3">
              <h2 className="text-xl font-semibold text-text-main sm:text-2xl">{t('cta.title')}</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-col gap-3 md:col-span-2 md:items-end">
              <Link
                href="/courses"
                className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold md:w-auto"
              >
                {t('cta.browseCourses')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/learn?tab=ai"
                className="btn-secondary inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm md:w-auto"
              >
                {t('cta.generateAI')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
