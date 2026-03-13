// components/BillingPage.tsx - Billing page component for dashboard

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  CreditCard,
  Coins,
  ArrowRight,
  Download,
  Filter,
  SlidersHorizontal,
  AlertTriangle,
  Info,
  Sparkles,
  FileText,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { HomeSection } from './HomeSection'
import { DashboardNavigation } from './DashboardNavigation'
import { calculatePriceForTokens, formatPrice, convertAmount, calculateTokens } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

type TransactionStatus = 'Completed' | 'Pending' | 'Failed'

interface Transaction {
  date: string
  time: string
  isoDate: string
  description: string
  type: 'Token top-up' | 'Course purchase' | 'AI strategy' | 'Custom course' | 'Adjustment'
  currencyAmount: string
  tokensDelta: string
  balanceAfter: string
  status: TransactionStatus
  apiType?: string // Store original API type for filtering
  tokens: number // Original tokens value for calculations
  amountGBP: number
}

function StatusPill({ status, t }: { status: TransactionStatus; t: any }) {
  let base =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px]'
  if (status === 'Completed') {
    return (
      <span className={`${base} border-emerald-500/60 text-emerald-200`}>
        <CheckCircle2 className="w-3 h-3" />
        <span>{t(`status.${status.toLowerCase()}`)}</span>
      </span>
    )
  }
  if (status === 'Pending') {
    return (
      <span className={`${base} border-amber-500/70 text-amber-200`}>
        <Clock className="w-3 h-3" />
        <span>{t(`status.${status.toLowerCase()}`)}</span>
      </span>
    )
  }
  return (
    <span className={`${base} border-rose-500/70 text-rose-200`}>
      <XCircle className="w-3 h-3" />
      <span>{t(`status.${status.toLowerCase()}`)}</span>
    </span>
  )
}

interface ApiTransaction {
  id: string
  type: string
  detail: string
  date: string
  tokens: number
  amount: number
  meta: string
  status?: TransactionStatus
  receiptAvailable?: boolean
}

export function BillingPage() {
  const t = useTranslations('dashboard.billingPage')
  const tDashboard = useTranslations('dashboard')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currency, setCurrency] = useState('GBP')
  const [typeFilter, setTypeFilter] = useState<
    'All' | 'Token top-ups' | 'Courses' | 'AI strategies' | 'Adjustments'
  >('All')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null)
  const [lastReceiptDate, setLastReceiptDate] = useState<string | null>(null)

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/transactions')
    }
  }, [status, router])

  // Load transactions from API
  useEffect(() => {
    async function fetchTransactions() {
      if (!session?.user?.id || status !== 'authenticated') return

      try {
        setIsLoadingTransactions(true)
        const response = await fetch('/api/transactions?limit=100')
        if (response.ok) {
          const data = await response.json()
          // Transform API response to Transaction format
          const formattedTransactions: Transaction[] = data.transactions.map((tx: ApiTransaction) => {
            const txDate = new Date(tx.date)
            const dateStr = txDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const timeStr = txDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })

            // Calculate currency amount
            const amountGBP = tx.amount || 0

            let currencyAmount = ''
            if (amountGBP > 0) {
              // For top-ups: convert GBP amount to selected currency
              const priceAmount = convertAmount(amountGBP, 'GBP', currency)
              currencyAmount = formatPrice(priceAmount, currency)
            } else if (tx.tokens && tx.tokens < 0) {
              // For token deductions: calculate price from tokens
              const tokensAbs = Math.abs(tx.tokens)
              const priceAmount = calculatePriceForTokens(tokensAbs, currency)
              currencyAmount = formatPrice(priceAmount, currency)
            } else {
              currencyAmount = formatPrice(0, currency)
            }

            // Format tokens delta
            const tokensDelta = tx.tokens > 0 
              ? `+${tx.tokens.toLocaleString('en-US')}` 
              : `${tx.tokens.toLocaleString('en-US')}`

            // Map API type to component type
            let componentType: Transaction['type'] = 'Adjustment'
            if (tx.type === 'Top-up') {
              componentType = 'Token top-up'
            } else if (tx.type === 'Custom course') {
              componentType = 'Custom course' // Keep as separate type
            } else if (tx.type === 'AI strategy') {
              componentType = 'AI strategy'
            }

            // Calculate balance after (simplified - would need to track running balance)
            // For now, we'll use a placeholder
            const balanceAfter = '—'

            return {
              date: dateStr,
              time: timeStr,
              isoDate: txDate.toISOString(),
              description: tx.detail,
              type: componentType,
              currencyAmount,
              tokensDelta,
              balanceAfter,
              status: (tx.status || 'Completed') as TransactionStatus,
              apiType: tx.type, // Store original API type
              tokens: tx.tokens, // Store original tokens value for calculations
              amountGBP,
            }
          })
          setTransactions(formattedTransactions)
          
          // Find last receipt (first transaction that has an invoice)
          if (formattedTransactions.length > 0) {
            const firstReceiptIndex = data.transactions.findIndex((tx: ApiTransaction) => tx.receiptAvailable !== false)
            if (firstReceiptIndex >= 0) {
              const lastTx = formattedTransactions[firstReceiptIndex]
              const apiTx = data.transactions[firstReceiptIndex]
              if (apiTx && lastTx) {
                setLastReceiptId(apiTx.id)
                setLastReceiptDate(`${lastTx.date} ${lastTx.time}`)
              }
            } else {
              setLastReceiptId(null)
              setLastReceiptDate(null)
            }
          }
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

  const usageEligibleTypes: Transaction['type'][] = ['Course purchase', 'Custom course', 'AI strategy']
  const getUsageTokens = (tx: Transaction): number => {
    if (tx.tokens < 0) {
      return Math.abs(tx.tokens)
    }
    if (usageEligibleTypes.includes(tx.type) && tx.amountGBP > 0) {
      return Math.round(calculateTokens(tx.amountGBP, 'GBP'))
    }
    return 0
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter === 'All') return true
    if (typeFilter === 'Token top-ups' && tx.type === 'Token top-up') return true
    if (typeFilter === 'Courses' && (tx.type === 'Course purchase' || tx.type === 'Custom course')) return true
    if (typeFilter === 'AI strategies' && tx.type === 'AI strategy') return true
    if (typeFilter === 'Adjustments' && tx.type === 'Adjustment') return true
    return false
  })

  // Calculate stats from transactions
  const currentBalance = userBalance || 0
  
  // Calculate this month spent (sum of negative tokens)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const usageEntries = transactions.map((tx) => ({
    tx,
    usageTokens: getUsageTokens(tx),
  }))

  const thisMonthTransactions = usageEntries.filter(({ tx, usageTokens }) => {
    const txDate = new Date(tx.isoDate)
    return txDate >= startOfMonth && usageTokens > 0
  })
  const thisMonthSpent = thisMonthTransactions.reduce((sum, entry) => sum + entry.usageTokens, 0)

  // Find last top-up amount
  const topUpTransactions = transactions.filter((tx) => tx.type === 'Token top-up')
  const lastTopUpTx = topUpTransactions[0] // Already sorted by date desc
  const lastTopUp = lastTopUpTx 
    ? parseFloat(lastTopUpTx.currencyAmount.replace(/[^0-9.]/g, '')) || 0
    : 0

  const usageTransactions = usageEntries.filter((entry) => entry.usageTokens > 0)
  const customSpent = usageTransactions
    .filter((entry) => entry.tx.type === 'Custom course')
    .reduce((sum, entry) => sum + entry.usageTokens, 0)
  const coursesSpent = usageTransactions
    .filter((entry) => entry.tx.type === 'Course purchase')
    .reduce((sum, entry) => sum + entry.usageTokens, 0)
  const aiSpent = usageTransactions
    .filter((entry) => entry.tx.type === 'AI strategy')
    .reduce((sum, entry) => sum + entry.usageTokens, 0)

  const totalSpent = coursesSpent + aiSpent + customSpent
  const coursesPercent = totalSpent > 0 ? Math.round((coursesSpent / totalSpent) * 100) : 0
  const aiPercent = totalSpent > 0 ? Math.round((aiSpent / totalSpent) * 100) : 0
  const customPercent = totalSpent > 0 ? Math.round((customSpent / totalSpent) * 100) : 0
  const remainingPercent = Math.max(0, 100 - coursesPercent - aiPercent - customPercent)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.26),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <main className="pt-6">
        {/* Dashboard Navigation */}
        <DashboardNavigation />

        {/* Top bar */}
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
                <Coins className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium">
                  {currentBalance.toLocaleString('en-US')} {t('tokensAvailable')}
                </span>
                <span className="text-slate-500">
                  {t('tokensApprox', { price: formattedBalancePrice })}
                </span>
              </div>
              <Link
                href="/top-up"
                className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-semibold hover:bg-cyan-300 transition"
              >
                <span>{t('topUp')}</span>
              </Link>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t('viewPricing')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </HomeSection>

        {/* Balance & payment info */}
        <HomeSection className="pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Balance card */}
          <motion.div
            className="lg:col-span-7 bg-slate-950/80 border border-slate-900 rounded-2xl p-4 sm:p-5 space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-50">
                  {t('balance.title')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t('balance.subtitle')}
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                <Info className="w-3 h-3" />
                <span>{t('balance.tokensInfo')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">
                  {t('balance.currentBalance')}
                </div>
                <div className="text-xl font-semibold text-slate-50">
                  {currentBalance.toLocaleString('en-US')}
                  <span className="text-base text-slate-400 ml-1">
                    {t('tokens')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {t('balance.currentBalanceHint', {
                    price: formattedBalancePrice,
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">
                  {t('balance.thisMonthSpent')}
                </div>
                <div className="text-lg font-semibold text-slate-50">
                  {thisMonthSpent.toLocaleString('en-US')} {t('tokens')}
                </div>
                <div className="text-[11px] text-slate-500">
                  {t('balance.thisMonthSpentHint')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">
                  {t('balance.lastTopUp')}
                </div>
                <div className="text-lg font-semibold text-slate-50">
                  {formatPrice(lastTopUp, currency)}
                </div>
                <div className="text-[11px] text-slate-500">
                  {t('balance.lastTopUpHint')}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>{t('balance.usageDistribution')}</span>
                {totalSpent > 0 ? (
                  <span className="text-slate-300">
                    {t('balance.usageDistributionValue', {
                      courses: coursesPercent,
                      ai: aiPercent,
                      custom: customPercent,
                    })}
                  </span>
                ) : (
                  <span>{t('balance.noUsageYet')}</span>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden flex">
                {totalSpent > 0 ? (
                  <>
                    {coursesPercent > 0 && (
                      <div className="h-full bg-cyan-400" style={{ width: `${coursesPercent}%` }} />
                    )}
                    {aiPercent > 0 && (
                      <div className="h-full bg-emerald-400" style={{ width: `${aiPercent}%` }} />
                    )}
                    {customPercent > 0 && (
                      <div className="h-full bg-indigo-500" style={{ width: `${customPercent}%` }} />
                    )}
                    {remainingPercent > 0 && (
                      <div className="h-full bg-slate-800" style={{ width: `${remainingPercent}%` }} />
                    )}
                  </>
                ) : (
                  <div className="h-full w-full bg-slate-800" />
                )}
              </div>
              {totalSpent > 0 && (
                <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2">
                  {coursesPercent > 0 && <span>Courses {coursesPercent}%</span>}
                  {aiPercent > 0 && <span>AI {aiPercent}%</span>}
                  {customPercent > 0 && <span>Custom courses {customPercent}%</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 mt-0.5" />
                <span>{t('balance.refundWarning')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-300 mt-0.5" />
                <span>{t('balance.supportInfo')}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment methods & invoices preview */}
          <motion.div
            className="lg:col-span-5 space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 space-y-3 text-[11px] text-slate-300/90">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('paymentMethods.title')}
                </div>
              </div>
              <p>{t('paymentMethods.description')}</p>
              <ul className="space-y-1.5">
                <li>• {t('paymentMethods.supportedCards')}</li>
                <li>• {t('paymentMethods.supportedCurrencies')}</li>
                <li>• {t('paymentMethods.chargesDescriptor')}</li>
              </ul>
              <p className="text-slate-400">{t('paymentMethods.note')}</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 space-y-3 text-[11px] text-slate-300/90">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('invoices.title')}
                </div>
              </div>
              <p>{t('invoices.description')}</p>
              <div className="mt-1 rounded-xl bg-slate-950 border border-slate-900 p-3 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-100">
                    {lastReceiptId 
                      ? (lastReceiptDate || t('invoices.lastReceipt.title'))
                      : t('invoices.lastReceipt.title')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {lastReceiptId 
                      ? t('invoices.lastReceipt.details')
                      : t('invoices.noReceipts')}
                  </span>
                </div>
                {lastReceiptId ? (
                  <a
                    href={`/api/receipts/${lastReceiptId}/pdf`}
                    download
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 text-[11px] text-slate-100 hover:border-slate-500 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>{t('invoices.downloadPDF')}</span>
                  </a>
                ) : (
                  <button 
                    disabled
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 text-[11px] text-slate-500 cursor-not-allowed"
                  >
                    <Download className="w-3 h-3" />
                    <span>{t('invoices.downloadPDF')}</span>
                  </button>
                )}
              </div>
              <Link
                href="/dashboard/receipts"
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition"
              >
                <span>{t('invoices.viewAllReceipts')}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        </HomeSection>

        {/* Transactions table */}
        <HomeSection className="pb-10 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-50">
                {t('transactions.title')}
              </div>
              <div className="text-[11px] text-slate-400">
                {t('transactions.subtitle')}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-800">
                <SlidersHorizontal className="w-3 h-3" />
                <span>{t('filters.type')}</span>
              </div>
              {(
                [
                  'All',
                  'Token top-ups',
                  'Courses',
                  'AI strategies',
                  'Adjustments',
                ] as const
              ).map((f, idx) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-2.5 py-1 rounded-full border transition ${
                    typeFilter === f
                      ? 'bg-slate-100 text-slate-950 border-slate-100'
                      : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {t(`filters.types.${f.toLowerCase().replace(/\s+/g, '')}`)}
                </button>
              ))}
              <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-950/90 text-slate-300 hover:border-slate-600 transition">
                <Filter className="w-3 h-3" />
                <span>{t('downloadCSV')}</span>
              </button>
            </div>
          </div>

          {isLoadingTransactions ? (
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="text-sm text-slate-400">Loading transactions...</div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/80">
              <div className="grid grid-cols-12 px-4 py-2 text-[11px] text-slate-400 border-b border-slate-900">
                <div className="col-span-2">{t('table.dateTime')}</div>
                <div className="col-span-3">{t('table.description')}</div>
                <div className="col-span-2">{t('table.type')}</div>
                <div className="col-span-2 text-right">{t('table.currency')}</div>
                <div className="col-span-1 text-right">{t('table.tokens')}</div>
                <div className="col-span-1 text-right">{t('table.balance')}</div>
                <div className="col-span-1 text-right">{t('table.status')}</div>
              </div>
              <div className="divide-y divide-slate-900">
                {filteredTransactions.map((tx) => (
                  <motion.div
                    key={`${tx.date}-${tx.time}-${tx.description}`}
                    className="grid grid-cols-12 px-4 py-3 text-[11px] text-slate-200 hover:bg-slate-900/70 transition-colors"
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="col-span-2 flex flex-col gap-0.5 pr-2">
                      <span className="text-slate-100">{tx.date}</span>
                      <span className="text-slate-500">{tx.time}</span>
                    </div>
                    <div className="col-span-3 flex flex-col gap-0.5 pr-2">
                      <span className="font-medium text-slate-50 truncate">
                        {tx.description}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        {tx.type === 'Course purchase' && (
                          <ShoppingCart className="w-3 h-3" />
                        )}
                        {tx.type === 'Token top-up' && (
                          <Coins className="w-3 h-3" />
                        )}
                        {tx.type === 'AI strategy' && (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {tx.type === 'Adjustment' && (
                          <AlertTriangle className="w-3 h-3 text-amber-300" />
                        )}
                        <span>{t(`types.${tx.type.toLowerCase().replace(/\s+/g, '')}`)}</span>
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center text-slate-300">
                      {t(`types.${tx.type.toLowerCase().replace(/\s+/g, '')}`)}
                    </div>
                    <div className="col-span-2 flex items-center justify-end text-slate-200">
                      {tx.currencyAmount}
                    </div>
                    <div className="col-span-1 flex items-center justify-end text-slate-200">
                      {tx.tokensDelta}
                    </div>
                    <div className="col-span-1 flex items-center justify-end text-slate-200">
                      {tx.balanceAfter}
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <StatusPill status={tx.status} t={t} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-100 mb-1">
                {t('emptyState.title')}
              </div>
              <div className="text-[11px] text-slate-400">
                {t('emptyState.description')}
              </div>
            </div>
          )}

          {/* Empty state preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3">
            <motion.div
              className="lg:col-span-7 bg-slate-950/80 border border-slate-900 rounded-2xl p-4 text-[11px] text-slate-300/90 space-y-2"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('emptyStatePreview.title')}
                </div>
              </div>
              <p>{t('emptyStatePreview.description')}</p>
              <div className="mt-2 rounded-xl bg-slate-950 border border-slate-900 p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-100 mb-0.5">
                    {t('emptyStatePreview.noActivity')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t('emptyStatePreview.hint')}
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-semibold hover:bg-cyan-300 transition"
                >
                  <Coins className="w-3 h-3" />
                  <span>{t('emptyStatePreview.viewTokenPacks')}</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </HomeSection>
      </main>
    </div>
  )
}

