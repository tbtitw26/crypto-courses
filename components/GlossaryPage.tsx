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
      {/* Dark reference hero with command-bar search */}
      <section className="bg-surface-900 pb-10 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.glossary')}</span>
          </div>

          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
              <BookOpenCheck className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{t('hero.title')}</h1>
              <p className="mt-1 max-w-lg text-sm text-surface-400">{t('hero.subtitle')}</p>
            </div>
          </div>

          {/* Side card inline */}
          <div className="mb-8 rounded-xl border border-surface-700 bg-surface-800/60 p-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-brand-400" />
              <p className="text-xs font-semibold text-white">{t('hero.sideCard.title')}</p>
              <span className="text-xs text-surface-500">— {t('hero.sideCard.subtitle')}</span>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-surface-400">
              {t('hero.sideCard.paragraph1')} {t('hero.sideCard.paragraph2')}
            </p>
          </div>

          {/* Command bar search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full rounded-xl border border-surface-600 bg-surface-800 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-surface-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-surface-600">
              {t('search.info')}
            </span>
          </div>
        </div>
      </section>

      {/* Category tabs strip */}
      <section className="border-b border-surface-200 bg-white">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="-mb-px flex gap-0 overflow-x-auto">
            {categories.map((cat) => {
              const isSelected = cat === selectedCategory
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition ${
                    isSelected
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-text-muted hover:border-surface-300 hover:text-text-secondary'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Term list — reference rows */}
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
            <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card">
              <div className="divide-y divide-surface-100">
                {filteredTerms.map((term) => {
                  const isExpanded = expandedTerm === term.id
                  return (
                    <div key={term.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedTerm(isExpanded ? null : term.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
                          {getCategoryIcon(term.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-main">{term.label}</span>
                            {term.tag && (
                              <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                                {term.tag}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-muted">{getCategoryLabel(term.category)}</span>
                        </div>
                        <p className="hidden max-w-xs truncate text-xs text-text-secondary lg:block">{term.short}</p>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="border-t border-surface-100 bg-surface-50 px-5 py-4">
                          <p className="mb-2 text-xs font-medium text-text-main">{term.short}</p>
                          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">{term.explanation}</p>
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

      {/* Info cards */}
      <section className="border-t border-surface-200 bg-white py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.education.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('infoCards.education.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('infoCards.education.description')}</p>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.linkFromCourses.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('infoCards.linkFromCourses.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('infoCards.linkFromCourses.description')}</p>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.updates.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('infoCards.updates.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('infoCards.updates.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-card md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/courses" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold">
                {t('cta.browseCourses')}
              </Link>
              <Link href="/learn?tab=ai" className="btn-secondary rounded-lg px-5 py-2.5 text-sm">
                {t('cta.generateAI')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
