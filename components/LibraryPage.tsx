'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  Cpu,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  Download,
  FolderOpen,
  ShoppingCart,
  Info,
  Sparkles,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { DashboardNavigation } from './DashboardNavigation'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'

interface CourseItem {
  title: string
  title_ar?: string | null
  level: string
  market: string
  type: 'Course PDF' | 'AI Strategy'
  slug?: string
  purchaseLanguage?: string
  description?: string
  description_ar?: string | null
  cover_image?: string | null
  downloadUrl?: string | null
}

function LibraryRow({ item, t, index }: { item: CourseItem; t: any; index?: number }) {
  const [locale, setLocale] = useState('en')
  const isAI = item.type === 'AI Strategy'

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

  const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
  const displayDescription =
    locale === 'ar' && item.description_ar ? item.description_ar : (item.description || '')
  const imagePath = item.cover_image ?? (item.slug ? getCourseImagePath(item.slug) : null)
  const shouldPrioritize = index !== undefined && index < 4
  const estimatedModules = 7

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {imagePath ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-surface-200">
          <Image
            src={imagePath}
            alt={displayTitle}
            fill
            className="object-cover"
            sizes="64px"
            quality={95}
            priority={shouldPrioritize}
          />
        </div>
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
          {isAI ? (
            <Cpu className="h-5 w-5 text-brand-600" />
          ) : (
            <BookOpen className="h-5 w-5 text-brand-600" />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-text-main">{displayTitle}</h3>
        {displayDescription && (
          <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">{displayDescription}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-xs text-text-secondary">
            {item.level}
          </span>
          <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-xs text-text-secondary">
            {item.market}
          </span>
          <span className="text-xs text-text-muted">
            {estimatedModules} {t('modules')} · {t('format')} {t('download')}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        {!isAI ? (
          item.downloadUrl ? (
            <a
              href={item.downloadUrl}
              download
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t('downloadPDF')}</span>
            </a>
          ) : (
            <span className="text-xs text-text-muted">{t('downloadPDF')}</span>
          )
        ) : (
          <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            {t('aiStrategy')}
          </span>
        )}
      </div>
    </div>
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

  useEffect(() => {
    async function fetchCourses() {
      if (!session?.user?.id) return

      try {
        setIsLoadingCourses(true)

        const coursesResponse = await fetch('/api/courses/purchased')
        let purchasedCourses: any[] = []
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          purchasedCourses = coursesData.courses || []
        }

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/courses')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user) {
    return null
  }

  const userBalance = session.user.balance || 0
  const balancePrice = calculatePriceForTokens(userBalance, currency)
  const formattedBalancePrice = formatPrice(balancePrice, currency)

  const recentItems: CourseItem[] = []

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
    <div className="min-h-screen bg-surface-50">
      <DashboardNavigation />

      <div className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 text-xs text-text-muted">
              <Link href="/dashboard" className="transition hover:text-text-secondary">
                {tDashboard('breadcrumb.dashboard')}
              </Link>
              <span className="text-text-muted/50"> / </span>
              <span className="text-text-secondary">{t('title')}</span>
            </div>
            <h1 className="text-xl font-semibold text-text-main sm:text-2xl">{t('heading')}</h1>
            <p className="mt-1 max-w-lg text-sm text-text-secondary">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-2.5 shadow-card">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <div className="text-sm">
              <span className="font-semibold text-text-main">
                {userBalance.toLocaleString('en-US')} {t('tokensAvailable')}
              </span>
              <span className="ml-1 text-text-muted">{t('tokensHint')}</span>
            </div>
            <Link href="/top-up" className="btn-primary rounded-lg px-3 py-1 text-xs font-semibold">
              {t('topUp')}
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border border-surface-200 bg-white p-4 shadow-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="input-field w-full rounded-lg py-2 pl-10 pr-4 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-text-muted">
                <SlidersHorizontal className="h-3 w-3" />
                <span>{t('type')}</span>
              </div>
              {(['All', 'Courses', 'AI strategies'] as const).map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`rounded-full border px-2.5 py-1 transition ${
                    typeFilter === f
                      ? 'border-brand-600 bg-brand-600 font-medium text-white'
                      : 'border-surface-200 bg-surface-50 text-text-secondary hover:border-surface-300'
                  }`}
                >
                  {t(`filters.type.${f.toLowerCase().replace(' ', '')}`)}
                </button>
              ))}
              <span className="mx-1 h-4 w-px bg-surface-200" />
              {['All levels', 'Beginner', 'Intermediate', 'Advanced'].map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setLevelFilter(f)}
                  className={`rounded-full border px-2.5 py-1 transition ${
                    levelFilter === f
                      ? 'border-brand-600 bg-brand-600 font-medium text-white'
                      : 'border-surface-200 bg-surface-50 text-text-secondary hover:border-surface-300'
                  }`}
                >
                  {t(`filters.level.${f.toLowerCase().replace(' ', '')}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Main: file-manager list */}
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-semibold text-text-main">{t('allItems.title')}</h2>
                <p className="text-xs text-text-muted">{t('allItems.subtitle')}</p>
              </div>
              <span className="rounded-full border border-surface-200 bg-white px-2.5 py-1 text-xs font-medium text-text-secondary">
                {filteredLibraryCourses.length} {t('splitByType')}
              </span>
            </div>

            {isLoadingCourses ? (
              <div className="flex items-center justify-center rounded-xl border border-surface-200 bg-white py-16 shadow-card">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : filteredLibraryCourses.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card">
                <div className="divide-y divide-surface-100">
                  {filteredLibraryCourses.map((item, index) => (
                    <LibraryRow key={item.title} item={item} t={t} index={index} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-200 bg-white p-10 text-center shadow-card">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-main">{t('noResults')}</h3>
                <p className="mt-1 text-sm text-text-muted">{t('noResultsDescription')}</p>
              </div>
            )}

            <div className="mt-3 text-right">
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center gap-1 text-xs text-text-muted transition hover:text-brand-600"
              >
                <Info className="h-3 w-3" />
                <span>{t('viewBilling')}</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-text-main">{t('emptyState.title')}</h3>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">{t('emptyState.description')}</p>
              <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-text-muted" />
                  <span className="text-sm font-semibold text-text-main">{t('emptyState.noItems')}</span>
                </div>
                <p className="mb-3 text-xs text-text-muted">{t('emptyState.hint')}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/courses" className="btn-primary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold">
                    <ShoppingCart className="h-3 w-3" />
                    <span>{t('emptyState.browseCourses')}</span>
                  </Link>
                  <Link href="/learn?tab=ai" className="btn-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs">
                    <Cpu className="h-3 w-3" />
                    <span>{t('emptyState.openAIStrategy')}</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-text-main">{t('sidebar.howLibraryFits.title')}</h3>
              </div>
              <ul className="space-y-2 text-xs leading-relaxed text-text-secondary">
                <li>
                  <span className="font-semibold text-text-main">{t('sidebar.howLibraryFits.library')}</span>{' '}
                  {t('sidebar.howLibraryFits.libraryDesc')}
                </li>
                <li>
                  <span className="font-semibold text-text-main">{t('sidebar.howLibraryFits.customCourses')}</span>{' '}
                  {t('sidebar.howLibraryFits.customCoursesDesc')}
                </li>
                <li>
                  <span className="font-semibold text-text-main">{t('sidebar.howLibraryFits.billing')}</span>{' '}
                  {t('sidebar.howLibraryFits.billingDesc')}
                </li>
                <li>
                  <span className="font-semibold text-text-main">{t('sidebar.howLibraryFits.settings')}</span>{' '}
                  {t('sidebar.howLibraryFits.settingsDesc')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
