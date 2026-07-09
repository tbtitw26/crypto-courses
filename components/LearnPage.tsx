// components/LearnPage.tsx - Course & Strategy Builder Studio

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { parseStartResponse } from '@/lib/jobs/parseStartResponse'
import { useJobStatus } from '@/lib/jobs/useJobStatus'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  FileText,
  Layers,
  Loader2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { calculateCustomCoursePrice } from '@/lib/custom-course-pricing'
import { calculateAIStrategyPrice } from '@/lib/ai-strategy-pricing'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

type TabKey = 'custom' | 'ai'

type StrategyPreset = 'conservative' | 'balanced' | 'scalping'

const STRATEGY_PRESET_PROFILES: Record<
  StrategyPreset,
  {
    experienceYears: '0' | '1-2' | '3+'
    depositBudget: '€500 - €1,000' | '€1,000 - €5,000' | '€5,000 - €20,000' | '€20,000+'
    riskTolerance: 'low' | 'medium' | 'high'
    tradingStyle: 'scalp' | 'day' | 'swing'
  }
> = {
  conservative: {
    experienceYears: '0',
    depositBudget: '€500 - €1,000',
    riskTolerance: 'low',
    tradingStyle: 'swing',
  },
  balanced: {
    experienceYears: '1-2',
    depositBudget: '€1,000 - €5,000',
    riskTolerance: 'medium',
    tradingStyle: 'day',
  },
  scalping: {
    experienceYears: '3+',
    depositBudget: '€5,000 - €20,000',
    riskTolerance: 'high',
    tradingStyle: 'scalp',
  },
}

const MARKET_LABELS: Record<'forex' | 'crypto' | 'binary', 'Forex' | 'Crypto' | 'Binary'> = {
  forex: 'Forex',
  crypto: 'Crypto',
  binary: 'Binary',
}

// ─── Chip toggle button ───

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-surface-300 bg-white text-text-secondary hover:border-surface-400'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Form section card ───

function FormSection({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-surface-300 bg-white shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-surface-200 px-5 py-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">{title}</h3>
        {hint && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ─── Main page ───

export function LearnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>('custom')
  const t = useTranslations('learn')
  const tInfo = useTranslations('learn.info')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'custom' || tab === 'ai') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    router.push(`/learn?tab=${tab}`)
  }

  return (
    <div className="min-h-screen">
      {/* ─── Studio hero ─── */}
      <section className="bg-white border-b border-surface-200">
        <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
        <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50">
              <Sparkles className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">
                {t('title')}
              </h1>
            </div>
          </div>
          <p className="max-w-lg text-sm sm:text-base text-text-secondary">{t('subtitle')}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-surface-300 bg-surface-50 px-2.5 py-1 text-xs font-medium text-text-muted">
            <Shield className="h-3 w-3 text-text-muted" />
            {tInfo('educationOnly')}
          </div>
        </div>
      </section>

      {/* ─── Mode switcher ─── */}
      <section className="mx-auto max-w-page px-4 mt-6 sm:px-6 lg:px-8">
        <div className="inline-flex rounded-full bg-surface-100 p-1 gap-1">
          <button
            onClick={() => handleTabChange('custom')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'custom'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <UserCog className="h-4 w-4" />
            Custom Course Builder
          </button>

          <button
            onClick={() => handleTabChange('ai')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'ai'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Cpu className="h-4 w-4" />
            AI Strategy Builder
          </button>
        </div>
      </section>

      {/* ─── Workspace ─── */}
      <section className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
        {activeTab === 'custom' ? <CustomCourseForm /> : <AIStrategyForm />}
      </section>
    </div>
  )
}

// ═══════════════════════════════════════════════
//  CUSTOM COURSE FORM
// ═══════════════════════════════════════════════

function CustomCourseForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const t = useTranslations('learn.custom')
  const tForm = useTranslations('learn.custom.form')
  const tSidebar = useTranslations('learn.custom.sidebar')
  const tAuth = useTranslations('learn.auth')
  const tCommon = useTranslations('common.auth')

  const jobIdFromUrl = searchParams.get('jobId') || undefined
  const [activeJobs, setActiveJobs] = useState<Array<{ jobId: string; language: string }>>([])

  useEffect(() => {
    if (jobIdFromUrl && activeJobs.length === 0) {
      setActiveJobs([{ jobId: jobIdFromUrl, language: 'en' }])
    }
  }, [jobIdFromUrl, activeJobs.length])

  const mainJobId = activeJobs.length > 0 ? activeJobs[0].jobId : jobIdFromUrl
  const { data: jobStatus, isLoading: isPolling, isTerminal } = useJobStatus('custom-course', mainJobId)

  const [experience, setExperience] = useState<string>('')
  const [markets, setMarkets] = useState<string[]>([])
  const [deposit, setDeposit] = useState<string>('')
  const [riskTolerance, setRiskTolerance] = useState<string>('')
  const [tradingStyle, setTradingStyle] = useState<string>('')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [goals, setGoals] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en'])
  const [consentEducation, setConsentEducation] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currency, setCurrency] = useState('GBP')
  const [showNewGenerationConfirm, setShowNewGenerationConfirm] = useState(false)

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const availablePlatforms = [
    'MT4', 'MT5', 'TradingView', 'Binance', 'MetaTrader', 'cTrader',
    'Interactive Brokers', 'eToro', 'Plus500', 'OANDA', 'IG', 'FXCM', 'Other',
  ]

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  const totalTokens = calculateCustomCoursePrice({
    experience: experience as 'beginner' | 'intermediate' | 'advanced' | '',
    deposit: deposit as 'low' | 'medium' | 'high' | 'veryHigh' | '',
    riskTolerance: riskTolerance as 'low' | 'medium' | 'high' | '',
    markets,
    selectedDays,
    selectedPlatforms,
    languages: selectedLanguages,
  })

  const userBalance = session?.user?.balance || 0
  const hasEnoughTokens = userBalance >= totalTokens
  const priceInCurrency = calculatePriceForTokens(totalTokens, currency)
  const formattedPrice = formatPrice(priceInCurrency, currency)

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const handleMarketToggle = (market: string) => {
    setMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    )
  }

  const handleLanguageToggle = (lang: 'en' | 'ar') => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev
        return prev.filter((l) => l !== lang)
      } else {
        if (prev.length >= 2) return prev
        return [...prev, lang]
      }
    })
  }

  const hasActiveJob = jobIdFromUrl && jobStatus && !isTerminal
  const isGenerateDisabled = isLoading || hasActiveJob || (session ? !hasEnoughTokens : false)

  const handleClearJobId = () => {
    setActiveJobs([])
    const tab = searchParams.get('tab') || 'custom'
    router.replace(`/learn?tab=${tab}`)
    setShowNewGenerationConfirm(false)
  }

  const handleStartNewGeneration = () => {
    setShowNewGenerationConfirm(true)
  }

  const handleConfirmNewGeneration = async () => {
    setShowNewGenerationConfirm(false)
    const form = document.querySelector('form')
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(event)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      showToast({
        title: tAuth('required'),
        description: tCommon('signIn'),
        variant: 'info',
      })
      router.push('/login?redirect=/learn?tab=custom')
      return
    }

    if (!experience || markets.length === 0 || !deposit || !riskTolerance || !tradingStyle || !goals || selectedLanguages.length === 0 || !consentEducation || !consentTerms) {
      showToast({
        title: 'Please fill all required fields',
        variant: 'error',
      })
      return
    }

    if (goals.trim().length < 10) {
      showToast({
        title: 'Goals too short',
        description: 'Please describe your goals in at least 10 characters.',
        variant: 'error',
      })
      return
    }

    if (!hasEnoughTokens) {
      showToast({
        title: tForm('calculator.insufficientBalance.title'),
        description: tForm('calculator.insufficientBalance.description'),
        variant: 'error',
      })
      router.push('/top-up')
      return
    }

    setIsLoading(true)

    try {
      const experienceYearsMap: Record<string, string> = {
        beginner: '0',
        intermediate: '1-2',
        advanced: '3+',
      }

      const marketsMap: Record<string, string> = {
        forex: 'Forex',
        crypto: 'Crypto',
        binary: 'Binary',
      }

      const depositBudgetMap: Record<string, string> = {
        low: '€500 - €1,000',
        medium: '€1,000 - €5,000',
        high: '€5,000 - €20,000',
        veryHigh: '€20,000+',
      }

      const timeCommitment = selectedDays.length > 0
        ? `${selectedDays.length} day(s) per week: ${selectedDays.join(', ')}`
        : undefined

      const platformsText = selectedPlatforms.length > 0
        ? selectedPlatforms.join(', ')
        : undefined

      const tradingStyleMap: Record<string, string> = {
        scalping: 'scalp',
        day: 'day',
        swing: 'swing',
        position: 'position',
      }

      const response = await fetch('/api/custom-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceYears: experienceYearsMap[experience] || '0',
          depositBudget: depositBudgetMap[deposit] || deposit,
          riskTolerance,
          markets: markets.map((m) => marketsMap[m] || m),
          tradingStyle: tradingStyleMap[tradingStyle] || tradingStyle,
          timeCommitment,
          goalsFreeText: goals.trim(),
          additionalNotes: notes || (platformsText ? `Platforms: ${platformsText}` : undefined),
          languages: selectedLanguages,
          tokensCost: totalTokens,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = errorData.message || errorData.error || 'Failed to submit request'
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          const fieldErrors = errorData.details.map((d: { path?: string[]; message?: string }) =>
            d.path?.length ? `${d.path.join('.')}: ${d.message}` : d.message
          ).join('; ')
          errorMessage = fieldErrors || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const parsed = parseStartResponse(data)

      if (!parsed.ok) {
        throw new Error(parsed.message || 'Failed to start generation')
      }

      if (parsed.jobs && parsed.jobs.length > 0) {
        setActiveJobs(parsed.jobs)
        const tab = searchParams.get('tab') || 'custom'
        router.replace(`/learn?tab=${tab}&jobId=${parsed.jobs[0].jobId}`)
      } else if (parsed.jobId) {
        setActiveJobs([{ jobId: parsed.jobId, language: 'en' }])
        const tab = searchParams.get('tab') || 'custom'
        router.replace(`/learn?tab=${tab}&jobId=${parsed.jobId}`)
      } else {
        throw new Error(parsed.message || 'No job ID received from server')
      }

      showToast({
        title: t('form.submitSuccess.title'),
        description: t('form.submitSuccess.description'),
        variant: 'success',
      })
    } catch (error) {
      console.error('Custom course submission error:', error)
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit request. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* ─── Form workspace ─── */}
      <div className="space-y-5">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text-main">{t('title')}</h2>
          <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile */}
          <FormSection title="Trader profile" hint={tForm('experience.required')}>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  {tForm('experience.label')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((key) => (
                    <Chip key={key} active={experience === key} onClick={() => setExperience(key)}>
                      {tForm(`experience.options.${key}`)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                  <span>{tForm('markets.label')}</span>
                  <span className="text-xs text-text-muted">{tForm('markets.hint')}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['forex', 'crypto', 'binary'] as const).map((key) => (
                    <Chip key={key} active={markets.includes(key)} onClick={() => handleMarketToggle(key)}>
                      {tForm(`markets.${key}`)}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          {/* Market & Risk */}
          <FormSection title="Market & Risk">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                  <span>{tForm('deposit.label')}</span>
                  <span className="text-xs text-text-muted">{tForm('deposit.hint')}</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['low', 'medium', 'high', 'veryHigh'] as const).map((key) => (
                    <Chip key={key} active={deposit === key} onClick={() => setDeposit(key)}>
                      {tForm(`deposit.options.${key}`)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                    <span>{tForm('risk.label')}</span>
                    <span className="text-xs text-text-muted">{tForm('risk.hint')}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['low', 'medium', 'high'] as const).map((key) => (
                      <Chip key={key} active={riskTolerance === key} onClick={() => setRiskTolerance(key)}>
                        {tForm(`risk.${key}`)}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                    <span>{tForm('style.label')}</span>
                    <span className="text-xs text-text-muted">{tForm('style.hint')}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['scalping', 'day', 'swing', 'position'] as const).map((key) => (
                      <Chip key={key} active={tradingStyle === key} onClick={() => setTradingStyle(key)}>
                        {tForm(`style.${key}`)}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Schedule & Tools */}
          <FormSection title="Schedule & tools">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  {tForm('time.label')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Chip key={day} active={selectedDays.includes(day)} onClick={() => handleDayToggle(day)}>
                      {tForm(`time.days.${day.toLowerCase()}`)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  {tForm('platforms.label')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePlatforms.map((platform) => (
                    <Chip key={platform} active={selectedPlatforms.includes(platform)} onClick={() => handlePlatformToggle(platform)}>
                      {platform}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          {/* Goals */}
          <FormSection title="Goals & notes">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                  <span>{tForm('goals.label')}</span>
                  <span className="text-xs text-text-muted">{tForm('goals.hint')}</span>
                </label>
                <textarea
                  rows={4}
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="input-field w-full resize-none text-sm"
                  placeholder={tForm('goals.placeholder')}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  {tForm('notes.label')}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field w-full resize-none text-sm"
                  placeholder={tForm('notes.placeholder')}
                />
              </div>
            </div>
          </FormSection>

          {/* Output settings */}
          <FormSection title="Output settings">
            <div>
              <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                <span>{tForm('language.label')}</span>
                <span className="text-xs text-text-muted">{tForm('language.required')}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(['en', 'ar'] as const).map((lang) => (
                  <Chip key={lang} active={selectedLanguages.includes(lang)} onClick={() => handleLanguageToggle(lang)}>
                    {tForm(`language.${lang}`)}
                  </Chip>
                ))}
              </div>
              {selectedLanguages.length === 2 && (
                <p className="mt-1.5 text-xs text-text-muted">{tForm('language.hint')}</p>
              )}
            </div>
          </FormSection>

          {/* Consent */}
          <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
              Consent & acknowledgement
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
                <input
                  type="checkbox"
                  checked={consentEducation}
                  onChange={(e) => setConsentEducation(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-400 accent-brand-600"
                />
                <span>{tForm('consents.education')}</span>
              </label>
              <label className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-400 accent-brand-600"
                />
                <span>
                  {tForm('consents.termsBefore')}{' '}
                  <Link href="/terms" className="font-medium text-brand-700 underline hover:text-brand-800">
                    {tForm('consents.termsLink')}
                  </Link>{' '}
                  {tForm('consents.termsAnd')}{' '}
                  <Link href="/risk-and-disclaimer" className="font-medium text-brand-700 underline hover:text-brand-800">
                    {tForm('consents.riskLink')}
                  </Link>
                  .
                </span>
              </label>
            </div>
          </div>

          {/* Submit area */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" disabled={isGenerateDisabled} className="btn-primary">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {tForm('submit')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
            {hasActiveJob && !showNewGenerationConfirm && (
              <button type="button" onClick={handleStartNewGeneration} className="btn-secondary">
                Start new generation
              </button>
            )}
            {showNewGenerationConfirm && (
              <div className="flex items-center gap-2 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-800">
                <span>This will start a new task and replace the current one.</span>
                <button
                  type="button"
                  onClick={handleConfirmNewGeneration}
                  className="rounded-md bg-gold-200 px-2 py-1 font-medium transition-colors hover:bg-gold-300"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGenerationConfirm(false)}
                  className="font-medium text-text-secondary hover:text-text-main"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="text-xs text-text-muted">{tForm('delivery')}</p>
          </div>
        </form>
      </div>

      {/* ─── Sidebar ─── */}
      <div className="space-y-5 lg:sticky lg:top-24">
        {/* Estimate */}
        <div className="rounded-xl border border-surface-300 bg-white shadow-card">
          <div className="flex items-center gap-2.5 border-b border-surface-200 px-5 py-3">
            <Coins className="h-4 w-4 text-gold-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {tForm('calculator.title')}
            </h3>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-text-muted">{tForm('calculator.total')}</span>
              <div className="text-right">
                <p className="font-heading text-2xl font-bold text-text-main">
                  {totalTokens.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-text-muted">
                  {tForm('calculator.tokens')} ≈ {formattedPrice}
                </p>
              </div>
            </div>
            {session && (
              <div className="mt-3 border-t border-surface-200 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{tForm('calculator.balance')}</span>
                  <span className={`font-semibold ${hasEnoughTokens ? 'text-brand-700' : 'text-rose-600'}`}>
                    {userBalance.toLocaleString('en-US')} {tForm('calculator.tokens')}
                  </span>
                </div>
                {!hasEnoughTokens && (
                  <div className="mt-2.5 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2.5">
                    <p className="text-xs text-gold-800">{tForm('calculator.insufficientBalance.message')}</p>
                    <Link
                      href="/top-up"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                    >
                      {tForm('calculator.insufficientBalance.topUp')}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deliverables */}
        <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700">
            <Clock className="h-3 w-3" />
            {tSidebar('delivery.badge')}
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">{tSidebar('delivery.description')}</p>
          <ul className="mt-3 space-y-2">
            {[tSidebar('delivery.points.modules'), tSidebar('delivery.points.examples'), tSidebar('delivery.points.checklist')].map(
              (point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>{point}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            {tSidebar('pricing.title')}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">{tSidebar('pricing.description')}</p>
          <ul className="mt-3 space-y-2">
            {[tSidebar('pricing.points.tokens'), tSidebar('pricing.points.currencies')].map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk notice */}
        <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gold-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-800">
              {tSidebar('risk.title')}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-gold-800/80">{tSidebar('risk.description')}</p>
          <Link
            href="/risk-and-disclaimer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            {tSidebar('risk.link')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
//  AI STRATEGY FORM
// ═══════════════════════════════════════════════

function AIStrategyForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const t = useTranslations('learn.ai')
  const tForm = useTranslations('learn.ai.form')
  const tSidebar = useTranslations('learn.ai.sidebar')
  const tAuth = useTranslations('learn.auth')
  const tCommon = useTranslations('common.auth')

  const jobIdFromUrl = searchParams.get('jobId') || undefined
  const [activeJobs, setActiveJobs] = useState<Array<{ jobId: string; language: string }>>([])

  useEffect(() => {
    if (jobIdFromUrl && activeJobs.length === 0) {
      setActiveJobs([{ jobId: jobIdFromUrl, language: 'en' }])
    }
  }, [jobIdFromUrl, activeJobs.length])

  const mainJobId = activeJobs.length > 0 ? activeJobs[0].jobId : jobIdFromUrl
  const { data: jobStatus, isLoading: isPolling, isTerminal } = useJobStatus('ai-strategy', mainJobId)

  const [preset, setPreset] = useState<StrategyPreset | ''>('')
  const [market, setMarket] = useState<'forex' | 'crypto' | 'binary'>('forex')
  const [timeframe, setTimeframe] = useState<'M15' | 'M30' | 'H1' | 'H4' | 'D1'>('H1')
  const [riskPerTrade, setRiskPerTrade] = useState('')
  const [maxTrades, setMaxTrades] = useState('')
  const [instruments, setInstruments] = useState('')
  const [focus, setFocus] = useState('')
  const [detailLevel, setDetailLevel] = useState<'quick' | 'standard' | 'deep' | ''>('')
  const [selectedLanguages, setSelectedLanguages] = useState<Array<'en' | 'ar'>>(['en'])
  const [consent, setConsent] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [experienceYears, setExperienceYears] = useState<'0' | '1-2' | '3+' | ''>('')
  const [depositBudget, setDepositBudget] = useState<
    '€500 - €1,000' | '€1,000 - €5,000' | '€5,000 - €20,000' | '€20,000+' | ''
  >('')
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high' | ''>('')
  const [markets, setMarkets] = useState<Array<'Forex' | 'Crypto' | 'Binary'>>(['Forex'])
  const [tradingStyle, setTradingStyle] = useState<'scalp' | 'day' | 'swing' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [currency, setCurrency] = useState('GBP')
  const [showNewGenerationConfirm, setShowNewGenerationConfirm] = useState(false)

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  useEffect(() => {
    const mappedMarket = MARKET_LABELS[market]
    setMarkets([mappedMarket])
  }, [market])

  useEffect(() => {
    if (!preset) {
      setExperienceYears('')
      setDepositBudget('')
      setRiskTolerance('')
      setTradingStyle('')
      return
    }

    const profile = STRATEGY_PRESET_PROFILES[preset]
    setExperienceYears(profile.experienceYears)
    setDepositBudget(profile.depositBudget)
    setRiskTolerance(profile.riskTolerance)
    setTradingStyle(profile.tradingStyle)
  }, [preset])

  const handleLanguageToggle = (lang: 'en' | 'ar') => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev
        return prev.filter((l) => l !== lang)
      }
      if (prev.length >= 2) return prev
      return [...prev, lang]
    })
  }

  const experienceMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | ''> = {
    '0': 'beginner',
    '1-2': 'intermediate',
    '3+': 'advanced',
  }

  const depositMap: Record<string, 'low' | 'medium' | 'high' | 'veryHigh' | ''> = {
    '€500 - €1,000': 'low',
    '€1,000 - €5,000': 'medium',
    '€5,000 - €20,000': 'high',
    '€20,000+': 'veryHigh',
  }

  const totalTokens = calculateAIStrategyPrice({
    preset: preset as 'conservative' | 'balanced' | 'scalping' | '',
    market: market as 'forex' | 'crypto' | 'binary' | '',
    timeframe: timeframe as 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | '',
    riskPerTrade,
    maxTrades,
    instruments,
    detailLevel: detailLevel as 'quick' | 'standard' | 'deep' | '',
    experience: experienceMap[experienceYears] || '',
    deposit: depositMap[depositBudget] || '',
    riskTolerance: riskTolerance as 'low' | 'medium' | 'high' | '',
    markets: markets.map((m) => m.toLowerCase()),
    tradingStyle: tradingStyle as 'scalp' | 'day' | 'swing' | '',
    languages: selectedLanguages,
  })

  const userBalance = session?.user?.balance || 0
  const hasEnoughTokens = userBalance >= totalTokens
  const priceInCurrency = calculatePriceForTokens(totalTokens, currency)
  const formattedPrice = formatPrice(priceInCurrency, currency)

  const hasActiveJob = (activeJobs.length > 0 || jobIdFromUrl) && jobStatus && !isTerminal
  const isGenerateDisabled = isLoading || hasActiveJob || (session ? !hasEnoughTokens : false)

  const handleClearJobId = () => {
    setActiveJobs([])
    const tab = searchParams.get('tab') || 'ai'
    router.replace(`/learn?tab=${tab}`)
    setShowNewGenerationConfirm(false)
  }

  const handleStartNewGeneration = () => {
    setShowNewGenerationConfirm(true)
  }

  const handleConfirmNewGeneration = async () => {
    setShowNewGenerationConfirm(false)
    const form = document.querySelector('form')
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(event)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      showToast({
        title: tAuth('required'),
        description: tCommon('signIn'),
        variant: 'info',
      })
      router.push('/login?redirect=/learn?tab=ai')
      return
    }

    if (
      !preset ||
      !market ||
      !timeframe ||
      !riskPerTrade ||
      !maxTrades ||
      !instruments ||
      !detailLevel ||
      selectedLanguages.length === 0 ||
      !consent ||
      !consentTerms ||
      !experienceYears ||
      !depositBudget ||
      !riskTolerance ||
      markets.length === 0 ||
      !tradingStyle ||
      !focus
    ) {
      showToast({
        title: 'Please fill all required fields',
        variant: 'error',
      })
      return
    }

    if (!hasEnoughTokens) {
      showToast({
        title: tForm('calculator.insufficientBalance.title'),
        description: tForm('calculator.insufficientBalance.description'),
        variant: 'error',
      })
      router.push('/top-up')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceYears,
          depositBudget,
          riskTolerance,
          markets,
          tradingStyle,
          mainObjective: focus,
          ...(market && { market }),
          ...(timeframe && { timeframe }),
          ...(riskPerTrade && { riskPerTrade }),
          ...(maxTrades && { maxTrades }),
          ...(instruments && { instruments }),
          ...(focus && { focus }),
          ...(detailLevel && { detailLevel }),
          languages: selectedLanguages,
          tokensCost: totalTokens,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Failed to generate strategy')
      }

      const data = await response.json()
      const parsed = parseStartResponse(data)

      if (!parsed.ok) {
        throw new Error(parsed.message || 'Failed to start generation')
      }

      if (parsed.jobs && parsed.jobs.length > 0) {
        setActiveJobs(parsed.jobs)
        const tab = searchParams.get('tab') || 'ai'
        router.replace(`/learn?tab=${tab}&jobId=${parsed.jobs[0].jobId}`)
      } else if (parsed.jobId) {
        setActiveJobs([{ jobId: parsed.jobId, language: 'en' }])
        const tab = searchParams.get('tab') || 'ai'
        router.replace(`/learn?tab=${tab}&jobId=${parsed.jobId}`)
      } else {
        throw new Error('No job ID received from server')
      }

      showToast({
        title: 'Request submitted',
        description: parsed.message || `Strategy generation started for ${parsed.jobs?.length || 1} language(s). You can close this window.`,
        variant: 'success',
      })
    } catch (error) {
      console.error('[AI Strategy] submission error:', error)
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate strategy. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* ─── Form workspace ─── */}
      <div className="space-y-5">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text-main">{t('title')}</h2>
          <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Strategy preset */}
          <FormSection title="Strategy preset" hint={tForm('presets.hint')}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                {tForm('presets.label')}
              </label>
              <div className="flex flex-wrap gap-2">
                {(['conservative', 'balanced', 'scalping'] as const).map((key) => (
                  <Chip key={key} active={preset === key} onClick={() => setPreset(key)}>
                    {tForm(`presets.${key}`)}
                  </Chip>
                ))}
              </div>
            </div>
          </FormSection>

          {/* Core parameters */}
          <FormSection title="Core parameters">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {tForm('market.label')}
                  </label>
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value as 'forex' | 'crypto' | 'binary')}
                    className="input-field w-full text-sm"
                  >
                    <option value="forex">Forex</option>
                    <option value="crypto">Crypto</option>
                    <option value="binary">Binary options</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {tForm('timeframe.label')}
                  </label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as 'M15' | 'M30' | 'H1' | 'H4' | 'D1')}
                    className="input-field w-full text-sm"
                  >
                    <option value="M15">M15</option>
                    <option value="M30">M30</option>
                    <option value="H1">H1</option>
                    <option value="H4">H4</option>
                    <option value="D1">D1</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {tForm('risk.label')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(e.target.value)}
                    className="input-field w-full text-sm"
                    placeholder={tForm('risk.placeholder')}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {tForm('maxTrades.label')}
                  </label>
                  <input
                    type="number"
                    value={maxTrades}
                    onChange={(e) => setMaxTrades(e.target.value)}
                    className="input-field w-full text-sm"
                    placeholder={tForm('maxTrades.placeholder')}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {tForm('instruments.label')}
                  </label>
                  <input
                    type="text"
                    value={instruments}
                    onChange={(e) => setInstruments(e.target.value)}
                    className="input-field w-full text-sm"
                    placeholder={tForm('instruments.placeholder')}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {tForm('focus.label')}
                  </label>
                  <input
                    type="text"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="input-field w-full text-sm"
                    placeholder={tForm('focus.placeholder')}
                  />
                </div>
              </div>
            </div>
          </FormSection>

          {/* Output options */}
          <FormSection title="Output settings">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                  <span>{tForm('detail.label')}</span>
                  <span className="text-xs text-text-muted">{tForm('detail.hint')}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['quick', 'standard', 'deep'] as const).map((key) => (
                    <Chip key={key} active={detailLevel === key} onClick={() => setDetailLevel(key)}>
                      {tForm(`detail.${key}`)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                  <span>{tForm('language.label')}</span>
                  <span className="text-xs text-text-muted">{tForm('language.required')}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['en', 'ar'] as const).map((lang) => (
                    <Chip key={lang} active={selectedLanguages.includes(lang)} onClick={() => handleLanguageToggle(lang)}>
                      {tForm(`language.${lang}`)}
                    </Chip>
                  ))}
                </div>
                {selectedLanguages.length === 2 && (
                  <p className="mt-1.5 text-xs text-text-muted">{tForm('language.hint')}</p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Consent */}
          <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
              Consent & acknowledgement
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-400 accent-brand-600"
                />
                <span>{tForm('consent')}</span>
              </label>
              <label className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-400 accent-brand-600"
                />
                <span>
                  {tForm('consentTermsBefore')}{' '}
                  <Link href="/terms" className="font-medium text-brand-700 underline hover:text-brand-800">
                    {tForm('consentTermsLink')}
                  </Link>{' '}
                  {tForm('consentTermsAnd')}{' '}
                  <Link href="/risk-and-disclaimer" className="font-medium text-brand-700 underline hover:text-brand-800">
                    {tForm('consentRiskLink')}
                  </Link>
                  .
                </span>
              </label>
            </div>
          </div>

          {/* Submit area */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="btn-primary"
              disabled={!consent || !consentTerms || isGenerateDisabled}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {tForm('submit')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
            {hasActiveJob && !showNewGenerationConfirm && (
              <button type="button" onClick={handleStartNewGeneration} className="btn-secondary">
                Start new generation
              </button>
            )}
            {showNewGenerationConfirm && (
              <div className="flex items-center gap-2 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-800">
                <span>This will start a new task and replace the current one.</span>
                <button
                  type="button"
                  onClick={handleConfirmNewGeneration}
                  className="rounded-md bg-gold-200 px-2 py-1 font-medium transition-colors hover:bg-gold-300"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGenerationConfirm(false)}
                  className="font-medium text-text-secondary hover:text-text-main"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="text-xs text-text-muted">{tForm('output')}</p>
          </div>
        </form>
      </div>

      {/* ─── Sidebar ─── */}
      <div className="space-y-5 lg:sticky lg:top-24">
        {/* Estimate */}
        <div className="rounded-xl border border-surface-300 bg-white shadow-card">
          <div className="flex items-center gap-2.5 border-b border-surface-200 px-5 py-3">
            <Coins className="h-4 w-4 text-gold-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {tForm('calculator.title')}
            </h3>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-text-muted">{tForm('calculator.total')}</span>
              <div className="text-right">
                <p className="font-heading text-2xl font-bold text-text-main">
                  {totalTokens.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-text-muted">
                  {tForm('calculator.tokens')} ≈ {formattedPrice}
                </p>
              </div>
            </div>
            {session && (
              <div className="mt-3 border-t border-surface-200 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{tForm('calculator.balance')}</span>
                  <span className={`font-semibold ${hasEnoughTokens ? 'text-brand-700' : 'text-rose-600'}`}>
                    {userBalance.toLocaleString('en-US')} {tForm('calculator.tokens')}
                  </span>
                </div>
                {!hasEnoughTokens && (
                  <div className="mt-2.5 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2.5">
                    <p className="text-xs text-gold-800">{tForm('calculator.insufficientBalance.message')}</p>
                    <Link
                      href="/top-up"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                    >
                      {tForm('calculator.insufficientBalance.topUp')}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI depth */}
        <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-md border border-[#c7c9f5] bg-[#eef0ff] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ai">
            <SlidersHorizontal className="h-3 w-3" />
            {tSidebar('depth.badge')}
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">{tSidebar('depth.description')}</p>
        </div>

        {/* Courses */}
        <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            {tSidebar('courses.title')}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">{tSidebar('courses.description')}</p>
        </div>

        {/* Risk notice */}
        <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gold-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-800">
              {tSidebar('risk.title')}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-gold-800/80">{tSidebar('risk.description')}</p>
          <Link
            href="/risk-and-disclaimer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            {tSidebar('risk.link')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
