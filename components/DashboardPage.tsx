'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  CreditCard,
  FileText,
  Settings,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { DashboardNavigation } from './DashboardNavigation'
import { calculatePriceForTokens, formatPrice, convertAmount } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

interface CourseItem {
  type: 'course' | 'ai' | 'custom'
  label: string
  title: string
  status: string
  market: string
  level?: string
  slug?: string
  purchaseLanguage?: string
  id?: string
  downloadUrl?: string | null
}

interface Transaction {
  type: string
  detail: string
  date: string
  amount: string
  meta: string
  amountGbp?: number
  tokens?: number
}

export function DashboardPage() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common.buttons')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currency, setCurrency] = useState('GBP')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [recentItems, setRecentItems] = useState<CourseItem[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  useEffect(() => {
    async function fetchTransactions() {
      if (!session?.user?.id) return

      try {
        setIsLoadingTransactions(true)
        const response = await fetch('/api/transactions?limit=10')
        if (response.ok) {
          const data = await response.json()
          const formattedTransactions: Transaction[] = data.transactions.map((tx: any) => {
            let priceInCurrency = ''
            if (tx.amount && tx.amount > 0) {
              const priceAmount = convertAmount(tx.amount, 'GBP', currency)
              priceInCurrency = formatPrice(priceAmount, currency)
            } else if (tx.tokens && tx.tokens < 0) {
              const tokensAbs = Math.abs(tx.tokens)
              const priceAmount = calculatePriceForTokens(tokensAbs, currency)
              priceInCurrency = formatPrice(priceAmount, currency)
            }

            const tokensDisplay =
              tx.tokens > 0
                ? `+${tx.tokens.toLocaleString('en-US')} tokens`
                : `${tx.tokens.toLocaleString('en-US')} tokens`

            return {
              type: tx.type,
              detail: tx.detail,
              date: new Date(tx.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              amount: priceInCurrency ? `${priceInCurrency} · ${tokensDisplay}` : tokensDisplay,
              meta: tx.meta,
              amountGbp: tx.amount,
              tokens: tx.tokens,
            }
          })
          setTransactions(formattedTransactions)
        }
      } catch (error) {
        console.error('Failed to load transactions:', error)
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    if (status === 'authenticated') {
      fetchTransactions()
    }
  }, [session?.user?.id, status, currency])

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

        const aiStrategiesResponse = await fetch('/api/ai-strategies')
        let aiStrategies: CourseItem[] = []
        if (aiStrategiesResponse.ok) {
          const aiData = await aiStrategiesResponse.json()
          const strategiesArray = aiData.strategies || []
          console.log('[Dashboard] Fetched AI strategies:', {
            count: strategiesArray.length,
            strategies: strategiesArray.map((s: any) => ({
              id: s.id,
              title: s.title,
              status: s.status,
              pdfLinksCount: s.pdfLinks?.length || 0,
            })),
          })

          aiStrategies = strategiesArray.map((strategy: any) => {
            const status =
              strategy.status === 'ready'
                ? 'Completed'
                : strategy.status === 'failed'
                ? 'Failed'
                : 'Processing'

            const downloadUrl = strategy.pdfLinks?.[0]?.url ||
              (status === 'Completed' ? `/api/download/ai-strategy/${strategy.id}` : null)

            return {
              type: 'ai' as const,
              label: 'AI Strategy',
              title: strategy.title,
              status,
              market: Array.isArray(strategy.markets) ? strategy.markets.join(', ') : '',
              downloadUrl,
              id: strategy.id,
            }
          })

          console.log('[Dashboard] Mapped AI strategies:', {
            count: aiStrategies.length,
            strategies: aiStrategies.map((s) => ({
              id: s.id,
              title: s.title,
              status: s.status,
              downloadUrl: s.downloadUrl ? 'present' : 'null',
            })),
          })
        } else {
          console.error('[Dashboard] Failed to fetch AI strategies:', {
            status: aiStrategiesResponse.status,
            statusText: aiStrategiesResponse.statusText,
          })
        }

        const customCoursesResponse = await fetch('/api/custom-courses')
        let customCourses: CourseItem[] = []
        if (customCoursesResponse.ok) {
          const customCoursesData = await customCoursesResponse.json()
          customCourses = (customCoursesData.courses || []).map((course: any) => ({
            type: 'custom' as const,
            label: 'Custom Course',
            title: course.title,
            status: course.status,
            market: course.market,
            level: course.level,
            id: course.id,
          }))
        }

        const courseItems: CourseItem[] = purchasedCourses.map((course: any) => ({
          type: 'course' as const,
          label: 'Course',
          title: course.title,
          status: 'Completed',
          market: course.market,
          level: course.level,
          slug: course.slug,
          purchaseLanguage: course.purchaseLanguage || 'en',
          downloadUrl: course.downloadUrl || null,
        }))

        const allItems = [...customCourses, ...courseItems, ...aiStrategies]
        setRecentItems(allItems)
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
      router.push('/login?callbackUrl=/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user) {
    return null
  }

  const userBalance = session.user.balance || 0
  const balancePrice = calculatePriceForTokens(userBalance, currency)
  const formattedBalancePrice = formatPrice(balancePrice, currency)

  const customCourseStatus = null
  const customCourseTitle = ''

  const tokensSpentLast30Days = 0
  const aiStrategiesGenerated = 0
  const coursesUnlocked = 0

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Command header */}
      <section className="bg-surface-900">
        <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-surface-500">
            <Link href="/" className="transition-colors hover:text-surface-300">{t('breadcrumb.home')}</Link>
            <span>/</span>
            <span className="text-surface-300">{t('breadcrumb.dashboard')}</span>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-white sm:text-3xl">{t('overview.title')}</h1>
              <p className="mt-1.5 max-w-lg text-sm text-surface-400">{t('overview.subtitle')}</p>
            </div>

            {/* Wallet card */}
            <div className="rounded-xl border border-surface-700 bg-surface-800 p-5 sm:min-w-[320px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-600 bg-surface-700">
                    <Wallet className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">{t('kpi.balance.title')}</p>
                    <p className="font-heading text-xl font-bold text-white">
                      {userBalance.toLocaleString('en-US')} <span className="text-sm font-normal text-surface-400">{tCommon('tokens')}</span>
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-surface-500">
                {t('kpi.balance.subtitle', { price: formattedBalancePrice })}
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="/top-up" className="btn-primary px-4 py-2 text-xs">
                  {t('kpi.balance.topUp')}
                </Link>
                <Link href="/pricing" className="inline-flex items-center rounded-lg border border-surface-600 bg-surface-700 px-4 py-2 text-xs font-medium text-surface-200 transition-colors hover:bg-surface-600">
                  {t('kpi.balance.viewPricing')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <DashboardNavigation />

      {/* Main content */}
      <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Status strip */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Custom course status */}
              <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-muted">{t('kpi.customCourse.title')}</p>
                  <Clock className="h-4 w-4 text-brand-600" />
                </div>
                {customCourseStatus ? (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-text-main">{customCourseTitle}</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      customCourseStatus === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gold-50 text-gold-700 border border-gold-200'
                    }`}>
                      <Clock className="h-2.5 w-2.5" />
                      {customCourseStatus === 'pending' && t('kpi.customCourse.status.pending')}
                      {customCourseStatus === 'inProgress' && t('kpi.customCourse.status.inProgress')}
                      {customCourseStatus === 'ready' && t('kpi.customCourse.status.ready')}
                    </span>
                    <p className="mt-2 text-xs text-text-muted">{t('kpi.customCourse.explanation')}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-secondary">{t('kpi.customCourse.noActive')}</p>
                )}
              </div>

              {/* Recent activity */}
              <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-muted">{t('kpi.recentActivity.title')}</p>
                  <Sparkles className="h-4 w-4 text-brand-600" />
                </div>
                {recentItems.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-text-main">
                      {t('kpi.recentActivity.subtitle', { count: recentItems.length })}
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                      {recentItems.slice(0, 3).map((item, index) => (
                        <li key={index} className="truncate">
                          {item.type === 'course' && t('kpi.recentActivity.completedCourse', { title: item.title })}
                          {item.type === 'ai' && t('kpi.recentActivity.generatedAI', { title: item.title })}
                          {item.type === 'custom' && t('kpi.recentActivity.requestedCustom', { market: item.market.toLowerCase() })}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-secondary">{t('kpi.recentActivity.noActivity')}</p>
                )}
              </div>

              {/* Billing snapshot */}
              <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-muted">{t('sidebar.billing.title')}</p>
                  <CreditCard className="h-4 w-4 text-brand-600" />
                </div>
                <div className="mt-3 space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center justify-between">
                    <span>{t('sidebar.billing.tokensSpent')}</span>
                    <span className="font-semibold text-text-main">{tokensSpentLast30Days.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('sidebar.billing.aiGenerated')}</span>
                    <span className="font-semibold text-text-main">{aiStrategiesGenerated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('sidebar.billing.coursesUnlocked')}</span>
                    <span className="font-semibold text-text-main">{coursesUnlocked}</span>
                  </div>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                >
                  {t('sidebar.billing.viewHistory')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Library */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-semibold text-text-main">{t('library.title')}</h2>
                  <p className="mt-0.5 text-xs text-text-muted">{t('library.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/courses" className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t('library.browseCourses')}
                  </Link>
                  <Link href="/learn?tab=ai" className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                    <Cpu className="h-3.5 w-3.5" />
                    {t('library.newAIStrategy')}
                  </Link>
                </div>
              </div>

              {isLoadingCourses ? (
                <div className="flex items-center justify-center rounded-xl border border-surface-300 bg-white p-12 shadow-card">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                </div>
              ) : recentItems.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-surface-300 bg-white shadow-card">
                  {recentItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                        index > 0 ? 'border-t border-surface-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
                          {item.type === 'course' && <BookOpen className="h-4 w-4 text-brand-600" />}
                          {item.type === 'ai' && <Cpu className="h-4 w-4 text-brand-600" />}
                          {item.type === 'custom' && <FileText className="h-4 w-4 text-brand-600" />}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                              {item.label}
                            </span>
                            <span className="rounded border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                              {item.market}
                            </span>
                            {item.level && (
                              <span className="rounded border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                                {item.level}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-sm font-medium text-text-main">{item.title}</p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            {(item.status === 'Completed' || item.status === 'completed') && (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" />
                                {t('library.item.status.completed')}
                              </span>
                            )}
                            {(item.status === 'Processing' || item.status === 'processing' || item.status === 'In progress') && (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <Clock className="h-3 w-3" />
                                {t('library.item.status.inprogress')}
                              </span>
                            )}
                            {item.status === 'Ready' && (
                              <span className="inline-flex items-center gap-1 text-brand-600">
                                <Sparkles className="h-3 w-3" />
                                {t('library.item.status.ready')}
                              </span>
                            )}
                            <span className="text-surface-300">·</span>
                            <span>{t('library.item.educationOnly')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 sm:text-right">
                        {item.type === 'ai' && item.status === 'Completed' && item.downloadUrl ? (
                          <a
                            href={item.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                          >
                            {t('library.item.downloadPDF')}
                          </a>
                        ) : item.type === 'ai' && (item.status === 'Processing' || item.status === 'processing') ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-text-muted">
                            {t('library.item.status.inprogress')}
                          </span>
                        ) : item.type === 'course' && item.downloadUrl ? (
                          <a
                            href={item.downloadUrl}
                            download
                            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                          >
                            {t('library.item.downloadPDF')}
                          </a>
                        ) : item.type === 'custom' && (item.status === 'Completed' || item.status === 'completed') ? (
                          <Link
                            href="/dashboard/custom-courses"
                            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                          >
                            {t('library.item.downloadPDF')}
                          </Link>
                        ) : item.type === 'custom' && (item.status === 'Processing' || item.status === 'processing') ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-text-muted">
                            {t('library.item.status.inprogress')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-surface-300 bg-white p-12 text-center shadow-card">
                  <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
                  <h3 className="mt-4 font-heading text-base font-semibold text-text-main">{t('library.empty.title')}</h3>
                  <p className="mt-1.5 text-sm text-text-muted">{t('library.empty.description')}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href="/courses" className="btn-primary px-5 py-2.5 text-sm">
                      {t('library.empty.browseCourses')}
                    </Link>
                    <Link href="/learn?tab=ai" className="btn-secondary px-5 py-2.5 text-sm">
                      {t('library.empty.generateAI')}
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Transactions */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-semibold text-text-main">{t('transactions.title')}</h2>
                  <p className="mt-0.5 text-xs text-text-muted">{t('transactions.subtitle')}</p>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                >
                  {t('transactions.viewAll')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {isLoadingTransactions ? (
                <div className="flex items-center justify-center rounded-xl border border-surface-300 bg-white p-12 shadow-card">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-surface-300 bg-white shadow-card">
                  <div className="hidden border-b border-surface-200 bg-surface-50 px-5 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                    <div className="col-span-3 text-xs font-bold uppercase tracking-wider text-text-muted">{t('transactions.table.type')}</div>
                    <div className="col-span-4 text-xs font-bold uppercase tracking-wider text-text-muted">{t('transactions.table.detail')}</div>
                    <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-text-muted">{t('transactions.table.date')}</div>
                    <div className="col-span-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted">{t('transactions.table.amount')}</div>
                  </div>
                  <div>
                    {transactions.map((tx, index) => (
                      <div key={index} className={`px-5 py-3.5 ${index > 0 ? 'border-t border-surface-200' : ''}`}>
                        {/* Mobile layout */}
                        <div className="flex items-center justify-between sm:hidden">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="rounded border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">{tx.type}</span>
                              <span className="text-xs text-text-muted">{tx.date}</span>
                            </div>
                            <p className="mt-1 truncate text-sm text-text-main">{tx.detail}</p>
                            {tx.meta && <p className="text-xs text-text-muted">{tx.meta}</p>}
                          </div>
                          <span className="shrink-0 pl-3 text-right text-xs font-semibold text-text-main">{tx.amount}</span>
                        </div>
                        {/* Desktop layout */}
                        <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-4">
                          <div className="col-span-3">
                            <span className="rounded border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">{tx.type}</span>
                          </div>
                          <div className="col-span-4 min-w-0">
                            <p className="truncate text-sm text-text-main">{tx.detail}</p>
                            {tx.meta && <p className="truncate text-xs text-text-muted">{tx.meta}</p>}
                          </div>
                          <div className="col-span-2 text-xs text-text-muted">{tx.date}</div>
                          <div className="col-span-3 text-right text-sm font-semibold text-text-main">{tx.amount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-surface-300 bg-white p-12 text-center shadow-card">
                  <CreditCard className="mx-auto h-12 w-12 text-surface-300" />
                  <h3 className="mt-4 font-heading text-base font-semibold text-text-main">{t('transactions.empty.title')}</h3>
                  <p className="mt-1.5 text-sm text-text-muted">{t('transactions.empty.description')}</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-24">
            {/* Quick actions */}
            <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('sidebar.quickActions.title')}</h3>
              <div className="mt-3 space-y-2">
                {[
                  { href: '/courses', icon: BookOpen, label: t('sidebar.quickActions.browseAll') },
                  { href: '/learn?tab=custom', icon: FileText, label: t('sidebar.quickActions.requestCustom') },
                  { href: '/learn?tab=ai', icon: Cpu, label: t('sidebar.quickActions.generateAI') },
                  { href: '/dashboard/settings', icon: Settings, label: 'Account settings' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex w-full items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-xs text-text-secondary transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-brand-600" />
                      {label}
                    </span>
                    <ArrowRight className="h-3 w-3 text-text-muted" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Risk reminder */}
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold-200 bg-gold-100">
                  <AlertTriangle className="h-4 w-4 text-gold-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gold-800">{t('sidebar.riskReminder.title')}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-gold-800/80">{t('sidebar.riskReminder.description')}</p>
                  <Link
                    href="/risk-and-disclaimer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold-700 transition-colors hover:text-gold-800"
                  >
                    {t('sidebar.riskReminder.cta')}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
