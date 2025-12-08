// components/LibraryPage.tsx - Library page component for dashboard

'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BookOpen,
  Cpu,
  Search,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Sparkles,
  FolderOpen,
  ArrowRight,
  ShoppingCart,
  Info,
} from 'lucide-react'
import { HomeSection } from './HomeSection'
import { DashboardNavigation } from './DashboardNavigation'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import Image from 'next/image'

interface CourseItem {
  title: string
  title_ar?: string | null
  level: string
  market: string
  type: 'Course PDF' | 'AI Strategy'
  slug?: string // Course slug for PDF download
  purchaseLanguage?: string // Language used when purchasing (en | ar)
  description?: string // Course description
  description_ar?: string | null
  cover_image?: string | null // Course cover image
  downloadUrl?: string | null
}

function LibraryCard({ item, t, index }: { item: CourseItem; t: any; index?: number }) {
  const [locale, setLocale] = useState('en')
  const isAI = item.type === 'AI Strategy'
  
  // Get locale from cookie
  useEffect(() => {
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find((c) => c.trim().startsWith('user_locale='))
    if (localeCookie) {
      const loc = localeCookie.split('=')[1]?.trim()
      if (loc === 'ar' || loc === 'en') {
        setLocale(loc)
      }
    }
  }, [])
  
  // Use localized title and description if available
  const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
  const displayDescription =
    locale === 'ar' && item.description_ar ? item.description_ar : (item.description || '')
  
  // Get course image path
  const imagePath = item.cover_image ?? (item.slug ? getCourseImagePath(item.slug) : null)
  
  // Add priority to first 4 images (above the fold)
  const shouldPrioritize = index !== undefined && index < 4
  
  // Estimate modules count (can be enhanced with actual data later)
  const estimatedModules = 7 // Default, can be enhanced
  
  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="flex flex-col bg-slate-950/80 border border-slate-900 rounded-2xl p-4 sm:p-5 gap-3 shadow-[0_18px_40px_rgba(15,23,42,0.75)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
          <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80">
            {item.level}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80">
            {item.market}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80">
            {t('format')}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3">
        {imagePath ? (
          <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
            <Image
              src={imagePath}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 128px"
              quality={95}
              priority={shouldPrioritize}
            />
          </div>
        ) : (
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700 flex-shrink-0">
            {isAI ? (
              <Cpu className="w-6 h-6 sm:w-8 sm:w-8 text-cyan-300" />
            ) : (
              <BookOpen className="w-6 h-6 sm:w-8 sm:w-8 text-cyan-300" />
            )}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-sm sm:text-[15px] font-semibold text-slate-50">
            {displayTitle}
          </h2>
          {displayDescription && (
            <p className="text-xs text-slate-300/90 leading-relaxed">
              {displayDescription}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <span>
          {estimatedModules} {t('modules')} · {t('format')} {t('download')}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-600" />
        <span>{t('educationOnly')}</span>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-900 flex items-center justify-between gap-3 text-sm">
        <div className="flex flex-col items-end gap-1">
          {!isAI ? (
            item.downloadUrl ? (
              <a
                href={item.downloadUrl}
                download
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-slate-100 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('downloadPDF')}</span>
              </a>
            ) : (
              <span className="text-[11px] text-slate-400">{t('downloadPDF')}</span>
            )
          ) : (
            <span className="text-[11px] text-slate-400">{t('aiStrategy')}</span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function LibraryPage() {
  const t = useTranslations('dashboard.libraryPage')
  const tDashboard = useTranslations('dashboard')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currency, setCurrency] = useState('GBP')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Courses' | 'AI strategies'>('All')
  const [levelFilter, setLevelFilter] = useState<string>('All levels')
  const [libraryCourses, setLibraryCourses] = useState<CourseItem[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  // Load purchased courses from API
  useEffect(() => {
    async function fetchCourses() {
      if (!session?.user?.id) return

      try {
        setIsLoadingCourses(true)
        
        // Fetch purchased courses
        const coursesResponse = await fetch('/api/courses/purchased')
        let purchasedCourses: any[] = []
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          purchasedCourses = coursesData.courses || []
        }

        // Transform purchased courses to CourseItem format
        const courseItems: CourseItem[] = purchasedCourses.map((course: any) => ({
          title: course.title,
          title_ar: course.title_ar || undefined,
          level: course.level,
          market: course.market,
          type: 'Course PDF' as const,
          slug: course.slug,
          purchaseLanguage: course.purchaseLanguage || 'en',
          description: course.description,
          description_ar: course.description_ar || undefined,
          cover_image: course.cover_image || null,
          downloadUrl: course.downloadUrl || null,
        }))

        setLibraryCourses(courseItems)
      } catch (error) {
        console.error('Failed to load courses:', error)
      } finally {
        setIsLoadingCourses(false)
      }
    }

    if (status === 'authenticated') {
      fetchCourses()
    }
  }, [session?.user?.id, status])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/courses')
    }
  }, [status, router])

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (status === 'unauthenticated' || !session?.user) {
    return null
  }

  const userBalance = session.user.balance || 0
  const balancePrice = calculatePriceForTokens(userBalance, currency)
  const formattedBalancePrice = formatPrice(balancePrice, currency)

  // Recent items (for dashboard, not used here but kept for consistency)
  const recentItems: CourseItem[] = []

  // Filter items based on search and filters
  const filteredLibraryCourses = libraryCourses.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.level.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      typeFilter === 'All' ||
      (typeFilter === 'Courses' && item.type === 'Course PDF') ||
      (typeFilter === 'AI strategies' && item.type === 'AI Strategy')

    const matchesLevel =
      levelFilter === 'All levels' || item.level === levelFilter

    return matchesSearch && matchesType && matchesLevel
  })

  const filteredRecentItems = recentItems.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.level.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.26),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      {/* Content */}
      <main className="pt-6">
        {/* Dashboard Navigation */}
        <DashboardNavigation />

        {/* Top bar / breadcrumb */}
        <HomeSection className="pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-300 transition">
                {tDashboard('breadcrumb.dashboard')}
              </Link>
              <span className="text-slate-600"> / </span>
              <span className="text-slate-300">{t('title')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
              {t('heading')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-xl">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 text-[11px]">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 border border-slate-800 px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium">
                  {userBalance.toLocaleString('en-US')} {t('tokensAvailable')}
                </span>
                <span className="text-slate-500">{t('tokensHint')}</span>
              </div>
              <Link
                href="/top-up"
                className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-semibold hover:bg-cyan-300 transition"
              >
                <span>{t('topUp')}</span>
              </Link>
            </div>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition"
            >
              <Info className="w-3 h-3" />
              <span>{t('viewBilling')}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </HomeSection>

        {/* Filters */}
        <HomeSection className="pb-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 flex-1"
                />
              </div>
              <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/90 text-[11px] text-slate-200 hover:border-slate-600 transition">
                <Filter className="w-3 h-3" />
                <span>{t('quickFilter')}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-800">
                <SlidersHorizontal className="w-3 h-3" />
                <span>{t('type')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Courses', 'AI strategies'] as const).map((f, idx) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={`px-2.5 py-1 rounded-full border transition ${
                      typeFilter === f
                        ? 'bg-slate-100 text-slate-950 border-slate-100'
                        : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {t(`filters.type.${f.toLowerCase().replace(' ', '')}`)}
                  </button>
                ))}
              </div>
              <div className="hidden md:flex flex-wrap gap-1.5">
                {['All levels', 'Beginner', 'Intermediate', 'Advanced'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setLevelFilter(f)}
                    className={`px-2.5 py-1 rounded-full border transition ${
                      levelFilter === f
                        ? 'bg-slate-100 text-slate-950 border-slate-100'
                        : 'border-slate-800 bg-slate-950/90 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {t(`filters.level.${f.toLowerCase().replace(' ', '')}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </HomeSection>

        {/* Main library */}
        <HomeSection className="pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-50">
                  {t('allItems.title')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t('allItems.subtitle')}
                </div>
              </div>
              <button className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition">
                <span className="inline-flex items-center gap-0.5">
                  <span className="h-3 w-3 rounded-sm bg-slate-800 border border-slate-600" />
                  <span className="h-3 w-3 rounded-sm bg-slate-900 border border-slate-700" />
                </span>
                <span>{t('splitByType')}</span>
              </button>
            </div>
            {filteredLibraryCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLibraryCourses.map((item, index) => (
                  <LibraryCard key={item.title} item={item} t={t} index={index} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-100 mb-1">
                  {t('noResults')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t('noResultsDescription')}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: empty state preview */}
          <div className="lg:col-span-4 space-y-4">
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 text-[11px] text-slate-300/90 space-y-2"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('emptyState.title')}
                </div>
              </div>
              <p>{t('emptyState.description')}</p>
              <div className="mt-2 rounded-xl bg-slate-950 border border-slate-900 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-300" />
                  <div className="text-xs font-semibold text-slate-100">
                    {t('emptyState.noItems')}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('emptyState.hint')}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-semibold hover:bg-cyan-300 transition"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>{t('emptyState.browseCourses')}</span>
                  </Link>
                  <Link
                    href="/learn?tab=ai"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-700 text-[11px] text-slate-100 hover:border-slate-500 transition"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>{t('emptyState.openAIStrategy')}</span>
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 text-[11px] text-slate-300/90 space-y-2"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('sidebar.howLibraryFits.title')}
                </div>
              </div>
              <ul className="space-y-1.5">
                <li>
                  • <span className="font-semibold">{t('sidebar.howLibraryFits.library')}</span>{' '}
                  {t('sidebar.howLibraryFits.libraryDesc')}
                </li>
                <li>
                  • <span className="font-semibold">{t('sidebar.howLibraryFits.customCourses')}</span>{' '}
                  {t('sidebar.howLibraryFits.customCoursesDesc')}
                </li>
                <li>
                  • <span className="font-semibold">{t('sidebar.howLibraryFits.billing')}</span>{' '}
                  {t('sidebar.howLibraryFits.billingDesc')}
                </li>
                <li>
                  • <span className="font-semibold">{t('sidebar.howLibraryFits.settings')}</span>{' '}
                  {t('sidebar.howLibraryFits.settingsDesc')}
                </li>
              </ul>
            </motion.div>
          </div>
        </HomeSection>
      </main>
    </div>
  )
}

