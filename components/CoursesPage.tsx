// components/CoursesPage.tsx - Courses listing page component

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useInView } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  FileText,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { CoursesPageCard } from './CoursesPageCard'

type Level = 'General' | 'Beginner' | 'Intermediate' | 'Advanced'
type Market = 'General' | 'Forex' | 'Crypto' | 'Binary'

interface Course {
  id: number
  slug: string
  level: string
  market: string
  title: string
  description: string
  tokens: number
  price_gbp: number
  cover_image?: string | null
}

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  )
}

export function CoursesPage() {
  const t = useTranslations('courses')
  const tBreadcrumb = useTranslations('courses.breadcrumb')
  const [courses, setCourses] = useState<Course[]>([])
  const [activeLevel, setActiveLevel] = useState<Level | 'All levels'>('All levels')
  const [activeMarket, setActiveMarket] = useState<Market | 'All markets'>('All markets')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const payload = await response.json()
          const courses = Array.isArray(payload) ? payload : payload?.data
          setCourses(Array.isArray(courses) ? courses : [])
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.warn('API returned error, using empty array:', errorData)
          setCourses([])
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
        setCourses([])
        setError('Unable to load courses. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const levelFilters: Array<Level | 'All levels'> = [
    'All levels',
    'General',
    'Beginner',
    'Intermediate',
    'Advanced',
  ]

  const marketFilters: Array<Market | 'All markets'> = [
    'All markets',
    'General',
    'Forex',
    'Crypto',
    'Binary',
  ]

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (activeLevel !== 'All levels' && course.level !== activeLevel) return false
      if (activeMarket !== 'All markets' && course.market !== activeMarket) return false
      if (!search.trim()) return true
      const term = search.toLowerCase()
      return (
        course.title.toLowerCase().includes(term) ||
        (course.description || '').toLowerCase().includes(term)
      )
    })
  }, [activeLevel, activeMarket, courses, search])

  const hasActiveFilters = activeLevel !== 'All levels' || activeMarket !== 'All markets' || search.trim().length > 0
  const resultLabel = isLoading
    ? 'Loading catalog'
    : `${filteredCourses.length} of ${courses.length} ${t('meta.coursesAvailable')}`

  const resetFilters = () => {
    setActiveLevel('All levels')
    setActiveMarket('All markets')
    setSearch('')
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-text-main">
      <main>
        <Section className="pb-10 pt-8 lg:pb-12 lg:pt-10">
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="transition hover:text-text-secondary">
              {tBreadcrumb('home')}
            </Link>
            <span className="text-text-muted/50">/</span>
            <span className="text-text-secondary">{tBreadcrumb('courses')}</span>
          </nav>

          <div className="grid gap-6 rounded-3xl border border-surface-300 bg-white p-5 shadow-card sm:p-7 lg:grid-cols-[1fr_360px] lg:p-8">
            <div className="space-y-6">
              <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
                <BookOpenCheck className="h-4 w-4 text-brand-800" />
                <span className="font-semibold text-brand-900">Course catalog</span>
                <span className="h-1 w-1 rounded-full bg-gold-500" />
                <span className="font-heading text-xs font-bold uppercase text-text-muted">
                  {t('detail.header.educationOnly')}
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="font-heading text-4xl font-semibold leading-tight tracking-display text-text-main sm:text-5xl lg:text-6xl">
                  {t('title')}
                </h1>
                <p className="text-base leading-7 text-text-secondary sm:text-lg">
                  {t('subtitle')} Browse structured PDFs by market and level, then use tokens or checkout to access your course.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <CatalogStat icon={BookOpen} label={resultLabel} text={t('meta.paymentInfo')} />
                <CatalogStat icon={ShieldCheck} label={t('detail.header.educationOnly')} text={t('course.educationOnly')} />
                <CatalogStat icon={FileText} label={t('detail.header.pdfFormat')} text="Downloadable course materials" />
              </div>
            </div>

            <div className="rounded-2xl border border-surface-300 bg-surface-950 p-5 text-white">
              <p className="font-heading text-xs font-bold uppercase text-gold-300">Need a different path?</p>
              <h2 className="mt-3 font-heading text-2xl font-semibold">Custom and AI options sit beside the catalog.</h2>
              <p className="mt-3 text-sm leading-6 text-surface-300">
                If the ready-made library does not match your current level, request a tailored PDF or generate an education-only strategy document.
              </p>
              <div className="mt-5 grid gap-2">
                <Link href="/learn?tab=custom" className="inline-flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-surface-950 transition hover:bg-brand-50">
                  {t('sidebar.customCourse.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/learn?tab=ai" className="inline-flex items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  {t('sidebar.aiStrategy.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Section>

        <Section className="pb-12">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-surface-300 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-text-main">
                    <SlidersHorizontal className="h-4 w-4 text-brand-800" />
                    {t('filters.label')}
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs font-semibold text-brand-800 hover:text-brand-900"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  <FilterGroup title="Level">
                    {levelFilters.map((lvl) => {
                      const label = lvl === 'All levels'
                        ? t('filters.level.all')
                        : t(`filters.level.${lvl.toLowerCase()}`)
                      return (
                        <FilterButton
                          key={lvl}
                          isActive={activeLevel === lvl}
                          onClick={() => setActiveLevel(lvl)}
                        >
                          {label}
                        </FilterButton>
                      )
                    })}
                  </FilterGroup>

                  <FilterGroup title="Market">
                    {marketFilters.map((mkt) => {
                      const label = mkt === 'All markets'
                        ? t('filters.market.all')
                        : t(`filters.market.${mkt.toLowerCase()}`)
                      return (
                        <FilterButton
                          key={mkt}
                          isActive={activeMarket === mkt}
                          onClick={() => setActiveMarket(mkt)}
                        >
                          {label}
                        </FilterButton>
                      )
                    })}
                  </FilterGroup>
                </div>
              </div>

              <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
                  <p className="text-sm leading-6 text-text-secondary">{t('sidebar.educationOnly.description')}</p>
                </div>
              </div>
            </aside>

            <div className="space-y-5">
              <div className="rounded-2xl border border-surface-300 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-text-main">
                      <Filter className="h-4 w-4 text-brand-800" />
                      {resultLabel}
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      {hasActiveFilters
                        ? `Filtered by ${activeLevel}, ${activeMarket}${search.trim() ? `, search: "${search.trim()}"` : ''}`
                        : 'Showing the full course library.'}
                    </p>
                  </div>

                  <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="input-field w-full rounded-xl pl-9"
                      placeholder={t('search.placeholder')}
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <LoadingCatalog />
              ) : error ? (
                <ErrorCatalog message={error} />
              ) : filteredCourses.length === 0 ? (
                <EmptyCatalog onReset={resetFilters} />
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  {filteredCourses.map((course, index) => (
                    <CoursesPageCard key={course.id} course={course} priority={index < 2} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      </main>
    </div>
  )
}

function CatalogStat({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof BookOpen
  label: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-surface-300 bg-surface-50 p-4">
      <Icon className="mb-4 h-5 w-5 text-brand-800" />
      <p className="text-sm font-semibold text-text-main">{label}</p>
      <p className="mt-1 text-sm leading-5 text-text-muted">{text}</p>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-xs font-bold uppercase text-text-muted">{title}</h2>
      <div className="flex flex-wrap gap-2 lg:grid">{children}</div>
    </div>
  )
}

function FilterButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
        isActive
          ? 'border-brand-600 bg-brand-50 text-brand-900'
          : 'border-surface-300 bg-white text-text-secondary hover:border-brand-200 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  )
}

function LoadingCatalog() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-surface-300 bg-white p-5 shadow-sm">
          <div className="skeleton aspect-[16/9]" />
          <div className="mt-5 h-4 w-3/4 rounded bg-surface-200" />
          <div className="mt-4 h-3 w-full rounded bg-surface-200" />
          <div className="mt-2 h-3 w-5/6 rounded bg-surface-200" />
        </div>
      ))}
    </div>
  )
}

function ErrorCatalog({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" />
        <div>
          <h2 className="font-heading text-base font-semibold text-text-main">{message}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            The courses list is temporarily unavailable. Please refresh the page or try again later.
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyCatalog({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
        <Search className="h-5 w-5" />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold text-text-main">No courses match this view.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
        Try a broader market, a different level, or clear the search query.
      </p>
      <button type="button" onClick={onReset} className="btn-secondary mt-5">
        Clear filters
      </button>
    </div>
  )
}
