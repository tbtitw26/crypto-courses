// components/DashboardPage.tsx - Dashboard page component

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Wallet,
  Sparkles,
  BookOpen,
  Cpu,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  History,
} from 'lucide-react'
import { HomeSection } from './HomeSection'
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
  slug?: string // Course slug for PDF download
  purchaseLanguage?: string // Language used when purchasing (en | ar)
  id?: string // Custom course ID
  downloadUrl?: string | null
}

interface Transaction {
  type: string
  detail: string
  date: string
  amount: string
  meta: string
  amountGbp?: number // Amount in GBP for currency conversion
  tokens?: number // Token amount for display
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

  // Load transactions from API
  useEffect(() => {
    async function fetchTransactions() {
      if (!session?.user?.id) return

      try {
        setIsLoadingTransactions(true)
        const response = await fetch('/api/transactions?limit=10')
        if (response.ok) {
          const data = await response.json()
          // Transform API response to Transaction format
          const formattedTransactions: Transaction[] = data.transactions.map((tx: any) => {
            // Calculate price in selected currency
            let priceInCurrency = ''
            if (tx.amount && tx.amount > 0) {
              // For top-ups: convert GBP amount to selected currency
              const priceAmount = convertAmount(tx.amount, 'GBP', currency)
              priceInCurrency = formatPrice(priceAmount, currency)
            } else if (tx.tokens && tx.tokens < 0) {
              // For token deductions: calculate price from tokens
              const tokensAbs = Math.abs(tx.tokens)
              const priceAmount = calculatePriceForTokens(tokensAbs, currency)
              priceInCurrency = formatPrice(priceAmount, currency)
            }

            // Format amount display: price + tokens
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

  // Load purchased courses and AI strategies from API
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

        // Fetch AI strategies (with download URLs)
        const aiStrategiesResponse = await fetch('/api/ai-strategies')
        let aiStrategies: CourseItem[] = []
        if (aiStrategiesResponse.ok) {
          const aiData = await aiStrategiesResponse.json()
          aiStrategies = (aiData.strategies || []).map((strategy: any) => ({
            type: 'ai' as const,
            label: 'AI Strategy',
            title: strategy.title,
            status:
              strategy.status === 'ready'
                ? 'Completed'
                : strategy.status === 'failed'
                ? 'Failed'
                : 'Processing',
            market: Array.isArray(strategy.markets) ? strategy.markets.join(', ') : '',
            downloadUrl: strategy.pdfLinks?.[0]?.url || null,
            id: strategy.id,
          }))
        }

        // Fetch custom courses
        const customCoursesResponse = await fetch('/api/custom-courses')
        let customCourses: CourseItem[] = []
        if (customCoursesResponse.ok) {
          const customCoursesData = await customCoursesResponse.json()
          customCourses = (customCoursesData.courses || []).map((course: any) => ({
            type: 'custom' as const,
            label: 'Custom Course',
            title: course.title,
            status: course.status, // 'Processing' or 'Completed'
            market: course.market,
            level: course.level,
            id: course.id,
          }))
        }

        // Transform purchased courses to CourseItem format
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

        // Combine and sort by date (most recent first)
        // Custom courses should appear first (most recent)
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard')
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

  // Custom course status (will be loaded from API later if needed)
  const customCourseStatus = null // 'pending' | 'inProgress' | 'ready' | null
  const customCourseTitle = ''

  // Statistics (will be replaced with real data from API later)
  const tokensSpentLast30Days = 0
  const aiStrategiesGenerated = 0
  const coursesUnlocked = 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-16">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <main className="pt-6">
        {/* Dashboard Navigation */}
        <DashboardNavigation />

        {/* Overview */}
        <HomeSection className="pb-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Link href="/" className="hover:text-slate-300 transition">
                  {t('breadcrumb.home')}
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300">{t('breadcrumb.dashboard')}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">{t('overview.title')}</h1>
              <p className="text-sm text-slate-300/90 max-w-xl">{t('overview.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
                <BarChart3 className="w-3 h-3 text-cyan-300" />
                <span>{t('overview.badges.learningOverview')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
                <History className="w-3 h-3 text-cyan-300" />
                <span>{t('overview.badges.recentActivity')}</span>
              </span>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Balance */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">{t('kpi.balance.title')}</span>
                <Wallet className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="text-lg font-semibold text-slate-50">
                {userBalance.toLocaleString('en-US')} {tCommon('tokens')}
              </div>
              <div className="text-[11px] text-slate-400">
                {t('kpi.balance.subtitle', { price: formattedBalancePrice })}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Link
                  href="/top-up"
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-semibold hover:bg-cyan-300 shadow-[0_10px_26px_rgba(8,145,178,0.55)] transition"
                >
                  {t('kpi.balance.topUp')}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-700 text-[11px] text-slate-100 hover:border-slate-500 transition"
                >
                  {t('kpi.balance.viewPricing')}
                </Link>
              </div>
            </motion.div>

            {/* Custom course status */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">{t('kpi.customCourse.title')}</span>
                <Clock className="w-4 h-4 text-cyan-300" />
              </div>
              {customCourseStatus ? (
                <>
                  <div className="text-sm font-semibold text-slate-50">{customCourseTitle}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/60 text-amber-200">
                      <Clock className="w-3 h-3" />
                      <span>
                        {customCourseStatus === 'pending' && t('kpi.customCourse.status.pending')}
                        {customCourseStatus === 'inProgress' && t('kpi.customCourse.status.inProgress')}
                        {customCourseStatus === 'ready' && t('kpi.customCourse.status.ready')}
                      </span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{t('kpi.customCourse.explanation')}</div>
                </>
              ) : (
                <div className="text-sm text-slate-300">{t('kpi.customCourse.noActive')}</div>
              )}
            </motion.div>

            {/* Recent activity */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">{t('kpi.recentActivity.title')}</span>
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              {recentItems.length > 0 ? (
                <>
                  <div className="text-sm font-semibold text-slate-50">
                    {t('kpi.recentActivity.subtitle', { count: recentItems.length })}
                  </div>
                  <ul className="mt-1 space-y-1.5 text-[11px] text-slate-300/90">
                    {recentItems.slice(0, 3).map((item, index) => (
                      <li key={index}>
                        {item.type === 'course' && t('kpi.recentActivity.completedCourse', { title: item.title })}
                        {item.type === 'ai' && t('kpi.recentActivity.generatedAI', { title: item.title })}
                        {item.type === 'custom' && t('kpi.recentActivity.requestedCustom', { market: item.market.toLowerCase() })}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="text-sm text-slate-300">{t('kpi.recentActivity.noActivity')}</div>
              )}
            </motion.div>
          </div>
        </HomeSection>

        {/* Main content grid */}
        <HomeSection className="pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Library */}
            <div className="lg:col-span-2 space-y-4">
              {/* Library header */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-50">{t('library.title')}</div>
                  <div className="text-[11px] text-slate-400">{t('library.subtitle')}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Link
                    href="/courses"
                    className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-700 text-slate-100 hover:border-slate-500 transition"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    <span>{t('library.browseCourses')}</span>
                  </Link>
                  <Link
                    href="/learn?tab=ai"
                    className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-700 text-slate-100 hover:border-slate-500 transition"
                  >
                    <Cpu className="w-3 h-3 mr-1" />
                    <span>{t('library.newAIStrategy')}</span>
                  </Link>
                </div>
              </div>

              {/* Library list */}
              {recentItems.length > 0 ? (
                <div className="space-y-3">
                  {recentItems.map((item, index) => (
                    <motion.div
                      key={index}
                      className="bg-slate-950/80 border border-slate-900 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
                      whileHover={{ y: -3, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 mt-0.5">
                          {item.type === 'course' && <BookOpen className="w-4 h-4 text-cyan-300" />}
                          {item.type === 'ai' && <Cpu className="w-4 h-4 text-cyan-300" />}
                          {item.type === 'custom' && <FileText className="w-4 h-4 text-cyan-300" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200">
                              {item.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300">
                              {item.market}
                            </span>
                            {item.level && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300">
                                {item.level}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300">
                              PDF
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-50">{item.title}</div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              {(item.status === 'Completed' || item.status === 'completed') && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                              {(item.status === 'Processing' || item.status === 'processing' || item.status === 'In progress') && <Clock className="w-3 h-3 text-amber-300" />}
                              {item.status === 'Ready' && <Sparkles className="w-3 h-3 text-cyan-300" />}
                              <span>
                                {(item.status === 'Completed' || item.status === 'completed') && t('library.item.status.completed')}
                                {(item.status === 'Processing' || item.status === 'processing' || item.status === 'In progress') && t('library.item.status.inprogress')}
                                {item.status === 'Ready' && t('library.item.status.ready')}
                              </span>
                            </span>
                            <span className="text-slate-600">·</span>
                            <span>{t('library.item.educationOnly')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-end sm:items-end gap-2 text-[11px]">
                        {(item.type === 'course' || item.type === 'ai') && item.downloadUrl ? (
                          <a
                            href={item.downloadUrl}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-950 font-semibold hover:bg-slate-200 transition"
                          >
                            <span>{t('library.item.downloadPDF')}</span>
                          </a>
                        ) : item.type === 'custom' && (item.status === 'Completed' || item.status === 'completed') ? (
                          <Link
                            href="/dashboard/custom-courses"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-950 font-semibold hover:bg-slate-200 transition"
                          >
                            <span>{t('library.item.downloadPDF')}</span>
                          </Link>
                        ) : item.type === 'custom' && (item.status === 'Processing' || item.status === 'processing') ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                            <span>{t('library.item.status.inprogress')}</span>
                          </span>
                        ) : item.type === 'ai' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                            <span>{t('library.item.downloadPDF')}</span>
                          </span>
                        ) : (
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-950 font-semibold hover:bg-slate-200 transition">
                            <span>{t('library.item.downloadPDF')}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">{t('library.empty.title')}</h3>
                  <p className="text-xs text-slate-400 mb-4">{t('library.empty.description')}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/courses"
                      className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition"
                    >
                      {t('library.empty.browseCourses')}
                    </Link>
                    <Link
                      href="/learn?tab=ai"
                      className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-full border border-slate-700 text-slate-100 hover:border-slate-500 transition"
                    >
                      {t('library.empty.generateAI')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Side column */}
            <div className="space-y-4">
              {/* Risk reminder */}
              <motion.div
                className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-2"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border border-amber-400/60">
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-50">{t('sidebar.riskReminder.title')}</div>
                    <div className="text-[11px] text-slate-300/90">{t('sidebar.riskReminder.description')}</div>
                    <Link
                      href="/risk-and-disclaimer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 transition"
                    >
                      <span>{t('sidebar.riskReminder.cta')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Billing snapshot */}
              <motion.div
                className="bg-slate-950/85 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                    <CreditCard className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-50">{t('sidebar.billing.title')}</div>
                    <div className="text-[11px] text-slate-400">{t('sidebar.billing.subtitle')}</div>
                  </div>
                </div>
                <div className="mt-1 space-y-2 text-[11px] text-slate-300/90">
                  <div className="flex items-center justify-between">
                    <span>{t('sidebar.billing.tokensSpent')}</span>
                    <span className="font-semibold text-slate-50">{tokensSpentLast30Days.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('sidebar.billing.aiGenerated')}</span>
                    <span className="font-semibold text-slate-50">{aiStrategiesGenerated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('sidebar.billing.coursesUnlocked')}</span>
                    <span className="font-semibold text-slate-50">{coursesUnlocked}</span>
                  </div>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 transition"
                >
                  <span>{t('sidebar.billing.viewHistory')}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>

              {/* Quick actions */}
              <motion.div
                className="bg-slate-950/85 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="text-xs font-semibold text-slate-50">{t('sidebar.quickActions.title')}</div>
                <div className="space-y-2 text-[11px] text-slate-300/90">
                  <Link
                    href="/courses"
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/60 hover:bg-slate-900 transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-cyan-300" />
                      <span>{t('sidebar.quickActions.browseAll')}</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </Link>
                  <Link
                    href="/learn?tab=custom"
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/60 hover:bg-slate-900 transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileText className="w-3 h-3 text-cyan-300" />
                      <span>{t('sidebar.quickActions.requestCustom')}</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </Link>
                  <Link
                    href="/learn?tab=ai"
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/60 hover:bg-slate-900 transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Cpu className="w-3 h-3 text-cyan-300" />
                      <span>{t('sidebar.quickActions.generateAI')}</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </HomeSection>

        {/* Transactions */}
        <HomeSection className="pb-12 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-slate-50">{t('transactions.title')}</div>
              <div className="text-[11px] text-slate-400">{t('transactions.subtitle')}</div>
            </div>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 transition"
            >
              <span>{t('transactions.viewAll')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoadingTransactions ? (
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="text-sm text-slate-400">Loading transactions...</div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/80">
              <div className="grid grid-cols-12 px-3 py-2 border-b border-slate-900 text-[11px] text-slate-400">
                <div className="col-span-3">{t('transactions.table.type')}</div>
                <div className="col-span-5">{t('transactions.table.detail')}</div>
                <div className="col-span-2">{t('transactions.table.date')}</div>
                <div className="col-span-2 text-right">{t('transactions.table.amount')}</div>
              </div>
              <div className="divide-y divide-slate-900">
                {transactions.map((tx, index) => (
                  <div key={index} className="grid grid-cols-12 px-3 py-2.5 text-[11px] text-slate-300/90">
                    <div className="col-span-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-200">
                        {tx.type}
                      </span>
                    </div>
                    <div className="col-span-5 flex flex-col">
                      <span className="text-slate-100">{tx.detail}</span>
                      <span className="text-slate-500">{tx.meta}</span>
                    </div>
                    <div className="col-span-2 text-slate-400">{tx.date}</div>
                    <div className="col-span-2 text-right font-semibold text-slate-100">{tx.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <CreditCard className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{t('transactions.empty.title')}</h3>
              <p className="text-xs text-slate-400">{t('transactions.empty.description')}</p>
            </div>
          )}
        </HomeSection>
      </main>
    </div>
  )
}

