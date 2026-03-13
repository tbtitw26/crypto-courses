// components/ReceiptsPage.tsx - Receipts/invoices page component

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  Download,
  ArrowRight,
  Filter,
  Search,
  Calendar,
  CreditCard,
  Coins,
  Sparkles,
  ShoppingCart,
} from 'lucide-react'
import { HomeSection } from './HomeSection'
import { DashboardNavigation } from './DashboardNavigation'
import { formatPrice, convertAmount } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

interface ReceiptTransaction {
  id: string
  type: 'Top-up' | 'Custom course' | 'AI strategy' | 'Course purchase'
  detail: string
  date: string
  tokens: number
  amount: number // Amount in GBP
  meta: string
  status?: 'Completed' | 'Pending' | 'Failed'
  receiptAvailable?: boolean
}

export function ReceiptsPage() {
  const t = useTranslations('dashboard.receiptsPage')
  const tDashboard = useTranslations('dashboard')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currency, setCurrency] = useState('GBP')
  const [transactions, setTransactions] = useState<ReceiptTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [typeFilter, setTypeFilter] = useState<
    'All' | 'Token top-ups' | 'Courses' | 'AI strategies' | 'Custom courses'
  >('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/receipts')
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
          // Transform API response to ReceiptTransaction format
          const formattedTransactions: ReceiptTransaction[] = data.transactions.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            detail: tx.detail,
            date: tx.date,
            tokens: tx.tokens,
            amount: tx.amount || 0,
            meta: tx.meta,
            status: tx.status,
            receiptAvailable: tx.receiptAvailable !== false,
          }))
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
  }, [session?.user?.id, status])

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

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Type filter
    if (typeFilter === 'All') {
      // Pass
    } else if (typeFilter === 'Token top-ups' && tx.type !== 'Top-up') {
      return false
    } else if (typeFilter === 'Courses' && tx.type !== 'Course purchase') {
      return false
    } else if (typeFilter === 'AI strategies' && tx.type !== 'AI strategy') {
      return false
    } else if (typeFilter === 'Custom courses' && tx.type !== 'Custom course') {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        tx.detail.toLowerCase().includes(query) ||
        tx.meta.toLowerCase().includes(query) ||
        tx.date.toLowerCase().includes(query)
      )
    }

    return true
  })

  const handleDownloadReceipt = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/receipts/${transactionId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${transactionId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to download receipt')
      }
    } catch (error) {
      console.error('Error downloading receipt:', error)
    }
  }

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
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">{t('heading')}</h1>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-xl">{t('subtitle')}</p>
          </div>
        </HomeSection>

        {/* Filters */}
        <HomeSection className="pb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 transition"
              />
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-800">
                <Filter className="w-3 h-3" />
                <span>{t('filters.type')}</span>
              </div>
              {(['All', 'Token top-ups', 'Courses', 'AI strategies', 'Custom courses'] as const).map((f) => (
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
            </div>
          </div>
        </HomeSection>

        {/* Receipts list */}
        <HomeSection className="pb-10">
          {isLoadingTransactions ? (
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="text-sm text-slate-400">Loading receipts...</div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const amountInCurrency = tx.amount > 0 ? convertAmount(tx.amount, 'GBP', currency) : 0
                const formattedAmount = tx.amount > 0 ? formatPrice(amountInCurrency, currency) : '—'

                return (
                  <motion.div
                    key={tx.id}
                    className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 mt-0.5">
                          {tx.type === 'Top-up' && <Coins className="w-5 h-5 text-cyan-300" />}
                          {tx.type === 'Course purchase' && <ShoppingCart className="w-5 h-5 text-cyan-300" />}
                          {tx.type === 'Custom course' && <FileText className="w-5 h-5 text-cyan-300" />}
                          {tx.type === 'AI strategy' && <Sparkles className="w-5 h-5 text-cyan-300" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs text-slate-200">
                              {tx.type}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(tx.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-50">{tx.detail}</div>
                          <div className="text-xs text-slate-400">{tx.meta}</div>
                          {tx.status && (
                            <div className="text-[11px] text-slate-400">Status: {tx.status}</div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-300">
                            {tx.tokens !== 0 && (
                              <span>
                                {tx.tokens > 0 ? '+' : ''}
                                {tx.tokens.toLocaleString('en-US')} tokens
                              </span>
                            )}
                            {tx.amount > 0 && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {formattedAmount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-end sm:items-end gap-2">
                      {tx.receiptAvailable ? (
                        <button
                          onClick={() => handleDownloadReceipt(tx.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition shadow-[0_10px_26px_rgba(8,145,178,0.55)]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('downloadPDF')}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 text-right max-w-[180px]">
                          Receipt becomes available after the provider confirms the payment.
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{t('emptyState.title')}</h3>
              <p className="text-xs text-slate-400">{t('emptyState.description')}</p>
            </div>
          )}
        </HomeSection>
      </main>
    </div>
  )
}

