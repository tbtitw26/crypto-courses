'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Cpu,
  AlertTriangle,
  ChevronRight,
  Clock,
  Coins,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Target,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { DashboardNavigation } from './DashboardNavigation'

type AiStrategyStatus = 'processing' | 'ready' | 'failed'

interface AiStrategy {
  id: string
  title: string
  markets: string[]
  status: AiStrategyStatus
  created: string
  tokens: number
  languages: string[]
  pdfLinks: Array<{ language: 'en' | 'ar'; url: string }>
}

function StatusBadge({ status, t }: { status: AiStrategyStatus; t: any }) {
  let classes = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium'
  let icon: React.ReactNode = null

  switch (status) {
    case 'processing':
      classes += ' border-blue-200 bg-blue-50 text-blue-700'
      icon = <Clock className="h-3 w-3 shrink-0" />
      break
    case 'ready':
      classes += ' border-emerald-200 bg-emerald-50 text-emerald-700'
      icon = <CheckCircle2 className="h-3 w-3 shrink-0" />
      break
    case 'failed':
      classes += ' border-rose-200 bg-rose-50 text-rose-700'
      icon = <XCircle className="h-3 w-3 shrink-0" />
      break
  }

  return (
    <span className={classes}>
      {icon}
      <span>{t(`status.${status}`)}</span>
    </span>
  )
}

export function AiStrategiesPage() {
  const t = useTranslations('dashboard.aiStrategiesPage')
  const tDashboard = useTranslations('dashboard')
  const { data: session, status } = useSession()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AiStrategyStatus>('all')
  const [strategies, setStrategies] = useState<AiStrategy[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/ai-strategies')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchStrategies() {
      if (!session?.user?.id || status !== 'authenticated') return

      try {
        setIsLoading(true)
        const response = await fetch('/api/ai-strategies')
        if (!response.ok) {
          console.error('Failed to fetch AI strategies')
          return
        }
        const data = await response.json()
        setStrategies(data.strategies || [])
      } catch (error) {
        console.error('Error fetching AI strategies:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStrategies()
  }, [session?.user?.id, status])

  const filteredStrategies = useMemo(() => {
    return strategies.filter((strategy) => {
      const matchesSearch =
        searchQuery === '' ||
        strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || strategy.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [strategies, searchQuery, statusFilter])

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
            <p className="mt-1 max-w-lg text-sm sm:text-base text-text-secondary">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/learn?tab=custom"
              className="inline-flex items-center gap-1 text-xs text-text-muted transition hover:text-brand-600"
            >
              <Target className="h-3.5 w-3.5" />
              <span>{t('switchToCustom')}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
            <Link
              href="/learn?tab=ai"
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <Cpu className="h-4 w-4" />
              <span>{t('generateNewStrategy')}</span>
            </Link>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="input-field w-full rounded-lg py-2 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="mr-1 text-text-muted">{t('filters.status')}:</span>
            {(['all', 'processing', 'ready', 'failed'] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-full border px-2.5 py-1 transition ${
                  statusFilter === f
                    ? 'border-brand-600 bg-brand-600 font-medium text-white'
                    : 'border-surface-200 bg-white text-text-secondary hover:border-surface-300'
                }`}
              >
                {t(`filters.statusOptions.${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Strategy documents */}
          <div className="lg:col-span-2 space-y-3">
            <div className="mb-1 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-text-main">{t('strategies.title')}</h2>
              <span className="text-xs text-text-muted">{t('strategies.subtitle')}</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center rounded-xl border border-surface-200 bg-white py-16 shadow-card">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : filteredStrategies.length > 0 ? (
              <div className="space-y-3">
                {filteredStrategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="rounded-xl border border-surface-200 bg-white p-5 shadow-card"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-text-main">{strategy.title}</h3>
                          <StatusBadge status={strategy.status} t={t} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                          <span>#{strategy.id}</span>
                          <span>{strategy.markets.length > 0 ? strategy.markets.join(', ') : t('table.noMarket')}</span>
                          <span className="capitalize">{strategy.languages.join(', ')}</span>
                          <span>{new Date(strategy.created).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
                          <Coins className="h-3.5 w-3.5 text-brand-600" />
                          <span>{strategy.tokens.toLocaleString('en-US')} tokens</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {strategy.status === 'ready' && strategy.pdfLinks.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {strategy.pdfLinks.map((link) => (
                              <a
                                key={`${strategy.id}-${link.language}`}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>{t(`actions.downloadPDF_${link.language}`)}</span>
                              </a>
                            ))}
                          </div>
                        ) : strategy.status === 'ready' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{t('actions.checkEmail')}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">{t('actions.processing')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-surface-200 bg-white p-10 text-center shadow-card">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-main">{t('emptyState.title')}</h3>
                <p className="mt-1 text-xs text-text-muted">{t('emptyState.description')}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('sidebar.builder.title')}</h3>
              </div>
              <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
                <li>• {t('sidebar.builder.points.objective')}</li>
                <li>• {t('sidebar.builder.points.market')}</li>
                <li>• {t('sidebar.builder.points.risk')}</li>
                <li>• {t('sidebar.builder.points.languages')}</li>
              </ul>
              <p className="mt-2 text-xs text-text-muted">{t('sidebar.builder.note')}</p>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('sidebar.delivery.title')}</h3>
              </div>
              <p className="text-sm leading-relaxed text-text-muted">{t('sidebar.delivery.description')}</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-text-secondary">
                <li>• {t('sidebar.delivery.points.pdf')}</li>
                <li>• {t('sidebar.delivery.points.email')}</li>
                <li>• {t('sidebar.delivery.points.library')}</li>
              </ul>
            </div>

            <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gold-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('sidebar.tips.title')}</h3>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{t('sidebar.tips.description')}</p>
              <Link
                href="/risk-and-disclaimer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                <span>{t('sidebar.tips.cta')}</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
