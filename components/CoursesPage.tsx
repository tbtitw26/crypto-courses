// components/CoursesPage.tsx - Courses listing page component

'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useInView } from 'framer-motion'
import { SlidersHorizontal, Search, ShieldCheck, AlertTriangle, BookOpen } from 'lucide-react'
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
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
          // Если API вернул ошибку, но это не критично - используем пустой массив
          const errorData = await response.json().catch(() => ({}))
          console.warn('API returned error, using empty array:', errorData)
          setCourses([])
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
        // В случае ошибки сети используем пустой массив
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

  const filteredCourses = courses.filter((course) => {
    if (activeLevel !== 'All levels' && course.level !== activeLevel) {
      return false
    }
    if (activeMarket !== 'All markets' && course.market !== activeMarket) {
      return false
    }
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      course.title.toLowerCase().includes(term) ||
      course.description.toLowerCase().includes(term)
    )
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-16">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <main className="pt-6">
        {/* Intro & controls */}
        <Section className="pb-6 space-y-6">
          <div className="flex flex-col gap-3">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Link href="/" className="hover:text-slate-300 transition">
                {tBreadcrumb('home')}
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">{tBreadcrumb('courses')}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
                  {t('title')}
                </h1>
                <p className="text-sm text-slate-300/90 max-w-xl">
                  {t('subtitle')}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 text-[11px] text-slate-400">
                <span>
                  {courses.length} {t('meta.coursesAvailable')}
                </span>
                <span>{t('meta.paymentInfo')}</span>
              </div>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-slate-200">
                <SlidersHorizontal className="w-3 h-3" />
                <span>{t('filters.label')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {levelFilters.map((lvl) => {
                  const label = lvl === 'All levels' 
                    ? t('filters.level.all') 
                    : t(`filters.level.${lvl.toLowerCase()}`)
                  return (
                    <button
                      key={lvl}
                      onClick={() => setActiveLevel(lvl)}
                      className={`px-2.5 py-1 rounded-full border transition ${
                        activeLevel === lvl
                          ? 'bg-slate-100 text-slate-950 border-slate-100'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {marketFilters.map((mkt) => {
                  const label = mkt === 'All markets'
                    ? t('filters.market.all')
                    : t(`filters.market.${mkt.toLowerCase()}`)
                  return (
                    <button
                      key={mkt}
                      onClick={() => setActiveMarket(mkt)}
                      className={`px-2.5 py-1 rounded-full border transition ${
                        activeMarket === mkt
                          ? 'bg-slate-100 text-slate-950 border-slate-100'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-1 lg:flex-none items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-full bg-slate-950/90 border border-slate-800 px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] text-slate-100 placeholder:text-slate-500 outline-none"
                  placeholder={t('search.placeholder')}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Courses grid & sidebar */}
        <Section className="pb-10">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              Loading courses...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4 text-sm flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="text-slate-100 font-medium text-xs">
                  {error}
                </div>
                <div className="text-[11px] text-slate-300/90">
                  The courses list is temporarily unavailable. Please refresh the page or try again later.
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                {filteredCourses.length === 0 ? (
                  <div className="rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-slate-100 font-medium text-xs">
                        {t('empty.title')}
                      </div>
                      <div className="text-[11px] text-slate-300/90">
                        {t('empty.description')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCourses.map((course) => (
                      <CoursesPageCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </div>

              {/* Right-side panel */}
              <aside className="lg:col-span-4 space-y-4">
                <motion.div
                  className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <div className="flex items-center justify-end gap-3 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-300" />
                      {t('detail.header.educationOnly')}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-cyan-300" />
                      {t('detail.header.pdfFormat')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300/90 mt-1">
                    {t('sidebar.educationOnly.description')}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <h2 className="text-xs font-semibold text-slate-50 mb-1">
                    {t('sidebar.customCourse.title')}
                  </h2>
                  <p className="text-[11px] text-slate-300/90 mb-2">
                    {t('sidebar.customCourse.description')}
                  </p>
                  <Link
                    href="/learn?tab=custom"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    <span>{t('sidebar.customCourse.cta')}</span>
                    <span>→</span>
                  </Link>
                </motion.div>

                <motion.div
                  className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <h2 className="text-xs font-semibold text-slate-50 mb-1">
                    {t('sidebar.aiStrategy.title')}
                  </h2>
                  <p className="text-[11px] text-slate-300/90 mb-2">
                    {t('sidebar.aiStrategy.description')}
                  </p>
                  <Link
                    href="/learn?tab=ai"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    <span>{t('sidebar.aiStrategy.cta')}</span>
                    <span>→</span>
                  </Link>
                </motion.div>
              </aside>
            </div>
          )}
        </Section>
      </main>
    </div>
  )
}

