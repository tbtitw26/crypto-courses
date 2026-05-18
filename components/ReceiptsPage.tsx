'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  CreditCard,
  Coins,
  Sparkles,
  ShoppingCart,
  Loader2,
} from 'lucide-react'
import { DashboardNavigation } from './DashboardNavigation'
import { formatPrice, convertAmount } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

interface ReceiptTransaction {
  id: string
  type: 'Top-up' | 'Custom course' | 'AI strategy' | 'Course purchase'
  detail: string
  date: string
  tokens: number
  amount: number
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/receipts')
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

  const filteredTransactions = transactions.filter((tx) => {
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

  const typeIcon = (type: ReceiptTransaction['type']) => {
    switch (type) {
      case 'Top-up':
        return <Coins className="h-4 w-4 text-brand-600" />
      case 'Course purchase':
        return <ShoppingCart className="h-4 w-4 text-brand-600" />
      case 'Custom course':
        return <FileText className="h-4 w-4 text-brand-600" />
      case 'AI strategy':
        return <Sparkles className="h-4 w-4 text-brand-600" />
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <DashboardNavigation />

      <div className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
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

        {/* Search + filters toolbar */}
        <div className="mb-6 rounded-xl border border-surface-200 bg-white p-4 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full rounded-lg py-2 pl-10 pr-4 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <div className="flex items-center gap-1 text-text-muted">
                <Filter className="h-3 w-3" />
                <span>{t('filters.type')}</span>
              </div>
              {(['All', 'Token top-ups', 'Courses', 'AI strategies', 'Custom courses'] as const).map((f) => (
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
                  {t(`filters.types.${f.toLowerCase().replace(/\s+/g, '')}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Receipt list */}
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center rounded-xl border border-surface-200 bg-white py-16 shadow-card">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card">
            <div className="divide-y divide-surface-100">
              {filteredTransactions.map((tx) => {
                const amountInCurrency = tx.amount > 0 ? convertAmount(tx.amount, 'GBP', currency) : 0
                const formattedAmount = tx.amount > 0 ? formatPrice(amountInCurrency, currency) : '—'

                return (
                  <div key={tx.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface-50 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-3 sm:contents">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-surface-200 bg-surface-50">
                        {typeIcon(tx.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                            {tx.type}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Calendar className="h-3 w-3" />
                            {new Date(tx.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          {tx.status && (
                            <span className="text-xs text-text-muted">Status: {tx.status}</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-text-main">{tx.detail}</p>
                        <p className="truncate text-xs text-text-muted">{tx.meta}</p>
                        <div className="mt-1 flex items-center gap-4 text-xs text-text-secondary">
                          {tx.tokens !== 0 && (
                            <span>
                              {tx.tokens > 0 ? '+' : ''}
                              {tx.tokens.toLocaleString('en-US')} tokens
                            </span>
                          )}
                          {tx.amount > 0 && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {formattedAmount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 sm:ml-auto">
                      {tx.receiptAvailable ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(tx.id)}
                          className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>{t('downloadPDF')}</span>
                        </button>
                      ) : (
                        <span className="block text-xs leading-relaxed text-text-muted sm:max-w-[160px] sm:text-right">
                          Receipt becomes available after the provider confirms the payment.
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white p-12 text-center shadow-card">
            <FileText className="mx-auto mb-3 h-10 w-10 text-surface-300" />
            <h3 className="text-sm font-semibold text-text-main">{t('emptyState.title')}</h3>
            <p className="mt-1 text-xs text-text-muted">{t('emptyState.description')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
