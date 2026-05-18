'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  Coins,
  ArrowRight,
  Download,
  SlidersHorizontal,
  AlertTriangle,
  Info,
  Sparkles,
  FileText,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
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
  apiType?: string
  tokens: number
  amountGBP: number
}

function StatusPill({ status, t }: { status: TransactionStatus; t: any }) {
  const base = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium'
  if (status === 'Completed') {
    return (
      <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>
        <CheckCircle2 className="h-3 w-3" />
        <span>{t(`status.${status.toLowerCase()}`)}</span>
      </span>
    )
  }
  if (status === 'Pending') {
    return (
      <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>
        <Clock className="h-3 w-3" />
        <span>{t(`status.${status.toLowerCase()}`)}</span>
      </span>
    )
  }
  return (
    <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>
      <XCircle className="h-3 w-3" />
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/transactions')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchTransactions() {
      if (!session?.user?.id || status !== 'authenticated') return

      try {
        setIsLoadingTransactions(true)
        const response = await fetch('/api/transactions?limit=100')
        if (response.ok) {
          const data = await response.json()
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

            const amountGBP = tx.amount || 0

            let currencyAmount = ''
            if (amountGBP > 0) {
              const priceAmount = convertAmount(amountGBP, 'GBP', currency)
              currencyAmount = formatPrice(priceAmount, currency)
            } else if (tx.tokens && tx.tokens < 0) {
              const tokensAbs = Math.abs(tx.tokens)
              const priceAmount = calculatePriceForTokens(tokensAbs, currency)
              currencyAmount = formatPrice(priceAmount, currency)
            } else {
              currencyAmount = formatPrice(0, currency)
            }

            const tokensDelta = tx.tokens > 0
              ? `+${tx.tokens.toLocaleString('en-US')}`
              : `${tx.tokens.toLocaleString('en-US')}`

            let componentType: Transaction['type'] = 'Adjustment'
            if (tx.type === 'Top-up') {
              componentType = 'Token top-up'
            } else if (tx.type === 'Custom course') {
              componentType = 'Custom course'
            } else if (tx.type === 'AI strategy') {
              componentType = 'AI strategy'
            }

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
              apiType: tx.type,
              tokens: tx.tokens,
              amountGBP,
            }
          })
          setTransactions(formattedTransactions)

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

  const currentBalance = userBalance || 0

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

  const topUpTransactions = transactions.filter((tx) => tx.type === 'Token top-up')
  const lastTopUpTx = topUpTransactions[0]
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
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-xs text-text-muted transition hover:text-brand-600"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('viewPricing')}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/top-up"
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <Coins className="h-4 w-4" />
              <span>{t('topUp')}</span>
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
            <p className="text-xs text-text-muted">{t('balance.currentBalance')}</p>
            <p className="mt-1 text-2xl font-semibold text-text-main">
              {currentBalance.toLocaleString('en-US')}
              <span className="ml-1 text-sm font-normal text-text-muted">{t('tokens')}</span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {t('balance.currentBalanceHint', { price: formattedBalancePrice })}
            </p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
            <p className="text-xs text-text-muted">{t('balance.thisMonthSpent')}</p>
            <p className="mt-1 text-2xl font-semibold text-text-main">
              {thisMonthSpent.toLocaleString('en-US')}
              <span className="ml-1 text-sm font-normal text-text-muted">{t('tokens')}</span>
            </p>
            <p className="mt-1 text-xs text-text-muted">{t('balance.thisMonthSpentHint')}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
            <p className="text-xs text-text-muted">{t('balance.lastTopUp')}</p>
            <p className="mt-1 text-2xl font-semibold text-text-main">{formatPrice(lastTopUp, currency)}</p>
            <p className="mt-1 text-xs text-text-muted">{t('balance.lastTopUpHint')}</p>
          </div>
        </div>

        {/* Usage distribution + info cards */}
        <div className="mb-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-surface-200 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-text-main">{t('balance.title')}</h2>
              </div>
              <span className="rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-[10px] text-text-muted">
                {t('balance.tokensInfo')}
              </span>
            </div>

            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                <span>{t('balance.usageDistribution')}</span>
                {totalSpent > 0 ? (
                  <span className="text-text-secondary">
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
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-100">
                {totalSpent > 0 ? (
                  <>
                    {coursesPercent > 0 && (
                      <div className="h-full bg-brand-500" style={{ width: `${coursesPercent}%` }} />
                    )}
                    {aiPercent > 0 && (
                      <div className="h-full bg-emerald-500" style={{ width: `${aiPercent}%` }} />
                    )}
                    {customPercent > 0 && (
                      <div className="h-full bg-indigo-500" style={{ width: `${customPercent}%` }} />
                    )}
                    {remainingPercent > 0 && (
                      <div className="h-full bg-surface-200" style={{ width: `${remainingPercent}%` }} />
                    )}
                  </>
                ) : (
                  <div className="h-full w-full bg-surface-200" />
                )}
              </div>
              {totalSpent > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                  {coursesPercent > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-brand-500" />
                      Courses {coursesPercent}%
                    </span>
                  )}
                  {aiPercent > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      AI {aiPercent}%
                    </span>
                  )}
                  {customPercent > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      Custom courses {customPercent}%
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-surface-100 pt-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-xs text-text-secondary">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                <span>{t('balance.refundWarning')}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-text-secondary">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span>{t('balance.supportInfo')}</span>
              </div>
            </div>
          </div>

          {/* Payment + invoices sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('paymentMethods.title')}</h3>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">{t('paymentMethods.description')}</p>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                <li>• {t('paymentMethods.supportedCards')}</li>
                <li>• {t('paymentMethods.supportedCurrencies')}</li>
                <li>• {t('paymentMethods.chargesDescriptor')}</li>
              </ul>
              <p className="mt-2 text-xs text-text-muted">{t('paymentMethods.note')}</p>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('invoices.title')}</h3>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">{t('invoices.description')}</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-surface-200 bg-surface-50 p-3">
                <div>
                  <p className="text-xs font-medium text-text-main">
                    {lastReceiptId
                      ? (lastReceiptDate || t('invoices.lastReceipt.title'))
                      : t('invoices.lastReceipt.title')}
                  </p>
                  <p className="text-xs text-text-muted">
                    {lastReceiptId
                      ? t('invoices.lastReceipt.details')
                      : t('invoices.noReceipts')}
                  </p>
                </div>
                {lastReceiptId ? (
                  <a
                    href={`/api/receipts/${lastReceiptId}/pdf`}
                    download
                    className="btn-secondary inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <Download className="h-3 w-3" />
                    <span>{t('invoices.downloadPDF')}</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs text-text-muted"
                  >
                    <Download className="h-3 w-3" />
                    <span>{t('invoices.downloadPDF')}</span>
                  </button>
                )}
              </div>
              <Link
                href="/dashboard/receipts"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                <span>{t('invoices.viewAllReceipts')}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Transactions table */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-main">{t('transactions.title')}</h2>
              <p className="text-xs text-text-muted">{t('transactions.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <div className="flex items-center gap-1 text-text-muted">
                <SlidersHorizontal className="h-3 w-3" />
                <span>{t('filters.type')}</span>
              </div>
              {(['All', 'Token top-ups', 'Courses', 'AI strategies', 'Adjustments'] as const).map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`rounded-full border px-2.5 py-1 transition ${
                    typeFilter === f
                      ? 'border-brand-600 bg-brand-600 font-medium text-white'
                      : 'border-surface-200 bg-white text-text-secondary hover:border-surface-300'
                  }`}
                >
                  {t(`filters.types.${f.toLowerCase().replace(/\s+/g, '')}`)}
                </button>
              ))}
            </div>
          </div>

          {isLoadingTransactions ? (
            <div className="flex items-center justify-center rounded-xl border border-surface-200 bg-white py-16 shadow-card">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card md:block">
                <div className="grid grid-cols-12 border-b border-surface-100 px-5 py-2.5 text-xs font-medium text-text-muted">
                  <div className="col-span-2">{t('table.dateTime')}</div>
                  <div className="col-span-3">{t('table.description')}</div>
                  <div className="col-span-2">{t('table.type')}</div>
                  <div className="col-span-2 text-right">{t('table.currency')}</div>
                  <div className="col-span-1 text-right">{t('table.tokens')}</div>
                  <div className="col-span-1 text-right">{t('table.balance')}</div>
                  <div className="col-span-1 text-right">{t('table.status')}</div>
                </div>
                <div className="divide-y divide-surface-100">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={`${tx.date}-${tx.time}-${tx.description}`}
                      className="grid grid-cols-12 px-5 py-3 text-xs text-text-main transition-colors hover:bg-surface-50"
                    >
                      <div className="col-span-2 flex flex-col gap-0.5 pr-2">
                        <span>{tx.date}</span>
                        <span className="text-text-muted">{tx.time}</span>
                      </div>
                      <div className="col-span-3 flex flex-col gap-0.5 pr-2">
                        <span className="truncate font-medium">{tx.description}</span>
                        <span className="flex items-center gap-1 text-text-muted">
                          {tx.type === 'Course purchase' && <ShoppingCart className="h-3 w-3" />}
                          {tx.type === 'Token top-up' && <Coins className="h-3 w-3" />}
                          {tx.type === 'AI strategy' && <Sparkles className="h-3 w-3" />}
                          {tx.type === 'Adjustment' && <AlertTriangle className="h-3 w-3 text-gold-600" />}
                          <span>{t(`types.${tx.type.toLowerCase().replace(/\s+/g, '')}`)}</span>
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center text-text-secondary">
                        {t(`types.${tx.type.toLowerCase().replace(/\s+/g, '')}`)}
                      </div>
                      <div className="col-span-2 flex items-center justify-end">{tx.currencyAmount}</div>
                      <div className="col-span-1 flex items-center justify-end">{tx.tokensDelta}</div>
                      <div className="col-span-1 flex items-center justify-end">{tx.balanceAfter}</div>
                      <div className="col-span-1 flex items-center justify-end">
                        <StatusPill status={tx.status} t={t} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 md:hidden">
                {filteredTransactions.map((tx) => (
                  <div
                    key={`m-${tx.date}-${tx.time}-${tx.description}`}
                    className="rounded-xl border border-surface-200 bg-white p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text-main">{tx.description}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{tx.date} · {tx.time}</p>
                      </div>
                      <StatusPill status={tx.status} t={t} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                      <span>{t(`types.${tx.type.toLowerCase().replace(/\s+/g, '')}`)}</span>
                      <div className="text-right">
                        <span className="font-medium text-text-main">{tx.currencyAmount}</span>
                        <span className="ml-2 text-text-muted">{tx.tokensDelta}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-surface-200 bg-white p-10 text-center shadow-card">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-main">{t('emptyState.title')}</h3>
              <p className="mt-1 text-xs text-text-muted">{t('emptyState.description')}</p>
            </div>
          )}

          {/* Empty state preview */}
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-brand-600" />
              <h3 className="text-xs font-semibold text-text-main">{t('emptyStatePreview.title')}</h3>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">{t('emptyStatePreview.description')}</p>
            <div className="mt-3 flex flex-col items-start justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-text-main">{t('emptyStatePreview.noActivity')}</p>
                <p className="text-xs text-text-muted">{t('emptyStatePreview.hint')}</p>
              </div>
              <Link
                href="/pricing"
                className="btn-primary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                <Coins className="h-3 w-3" />
                <span>{t('emptyStatePreview.viewTokenPacks')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
