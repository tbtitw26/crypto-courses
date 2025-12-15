// components/LearnPage.tsx - Learn page component with Custom Course and AI Strategy tabs

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { parseStartResponse } from '@/lib/jobs/parseStartResponse'
import { useJobStatus } from '@/lib/jobs/useJobStatus'
import {
  UserCog,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  Clock,
  Layers,
  ArrowRight,
  Info,
  Coins,
} from 'lucide-react'
import Link from 'next/link'
import { HomeSection } from './HomeSection'
import { calculateCustomCoursePrice } from '@/lib/custom-course-pricing'
import { calculateAIStrategyPrice } from '@/lib/ai-strategy-pricing'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

type TabKey = 'custom' | 'ai'

type StrategyPreset = 'conservative' | 'balanced' | 'scalping'

// Component for displaying status of a single job
function JobStatusBlock({
  jobId,
  language,
  jobType,
  onClear,
}: {
  jobId: string
  language: string
  jobType: 'custom-course' | 'ai-strategy'
  onClear?: () => void
}) {
  const { data: jobStatus, isLoading: isPolling, isTerminal } = useJobStatus(jobType, jobId)
  const langLabel = language === 'ar' ? 'AR' : 'EN'

  if (!jobStatus) {
    return null
  }

  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-300">
            {langLabel} — {isTerminal ? 'Last run' : 'Status'}
          </span>
          {isPolling && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
        </div>
        {isTerminal && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-slate-400 hover:text-slate-200 transition"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {/* Stage text */}
        <div className="text-[11px] text-slate-200">
          {jobStatus.stage || jobStatus.status || 'Unknown'}
        </div>

        {/* Progress removed per Step 8 - keep only status text */}

        {/* Spinner if no progress but not terminal */}
        {!isTerminal && typeof jobStatus.progress !== 'number' && (
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="animate-spin">⏳</span>
            <span>Processing...</span>
          </div>
        )}

        {/* Error message */}
        {jobStatus.status === 'failed' && jobStatus.error && (
          <div className="text-[10px] text-red-400 mt-1">{jobStatus.error}</div>
        )}

        {/* Success with PDF link */}
        {jobStatus.status === 'ready' && jobStatus.result?.pdfUrl && (
          <a
            href={jobStatus.result.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 transition mt-1"
          >
            <span>Open PDF</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

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

function LearnTabSwitcher({
  active,
  onChange,
}: {
  active: TabKey
  onChange: (key: TabKey) => void
}) {
  const t = useTranslations('learn.tabs')

  const tabs: { key: TabKey; label: string; icon: typeof UserCog }[] = [
    {
      key: 'custom',
      label: t('custom'),
      icon: UserCog,
    },
    {
      key: 'ai',
      label: t('ai'),
      icon: Cpu,
    },
  ]

  return (
    <div className="inline-flex items-stretch rounded-full bg-slate-950/90 border border-slate-800 p-1 text-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              isActive
                ? 'bg-slate-100 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-cyan-300'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-cyan-300'}`}
            />
            <span className="font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function LearnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>('custom')
  const t = useTranslations('learn')
  const tBreadcrumb = useTranslations('learn.breadcrumb')
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
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-16">
      <main className="pt-6">
        <HomeSection className="pb-6 space-y-6">
          <div className="flex flex-col gap-3">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Link href="/" className="hover:text-slate-300 transition">
                {tBreadcrumb('home')}
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">{tBreadcrumb('learn')}</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">{t('title')}</h1>
                <p className="text-sm text-slate-300/90 max-w-xl">{t('subtitle')}</p>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-2">
                <LearnTabSwitcher active={activeTab} onChange={handleTabChange} />
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-800">
                    <Info className="w-3 h-3 text-cyan-300" />
                    <span>{tInfo('educationOnly')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HomeSection>

        <HomeSection className="pb-10">
          {activeTab === 'custom' ? <CustomCourseForm /> : <AIStrategyForm />}
        </HomeSection>
      </main>
    </div>
  )
}

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

  // Read jobId(s) from URL or state
  const jobIdFromUrl = searchParams.get('jobId') || undefined
  const [activeJobs, setActiveJobs] = useState<Array<{ jobId: string; language: string }>>([])
  
  // For backward compatibility: if we have URL jobId but no activeJobs, use it
  useEffect(() => {
    if (jobIdFromUrl && activeJobs.length === 0) {
      setActiveJobs([{ jobId: jobIdFromUrl, language: 'en' }])
    }
  }, [jobIdFromUrl, activeJobs.length])
  
  // For backward compatibility: use first job as main jobStatus if only one job
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

  // Available days of the week
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Available platforms
  const availablePlatforms = [
    'MT4',
    'MT5',
    'TradingView',
    'Binance',
    'MetaTrader',
    'cTrader',
    'Interactive Brokers',
    'eToro',
    'Plus500',
    'OANDA',
    'IG',
    'FXCM',
    'Other',
  ]

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  // Calculate price based on selections
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
        // Don't allow removing the last language
        if (prev.length === 1) return prev
        return prev.filter((l) => l !== lang)
      } else {
        // Don't allow more than 2 languages
        if (prev.length >= 2) return prev
        return [...prev, lang]
      }
    })
  }

  // Check if there's an active job (not terminal)
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
    // Continue with normal submit flow - jobId will be replaced in handleSubmit
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

    // Validate required fields
    if (!experience || markets.length === 0 || !deposit || !riskTolerance || !tradingStyle || !goals || selectedLanguages.length === 0 || !consentEducation || !consentTerms) {
      showToast({
        title: 'Please fill all required fields',
        variant: 'error',
      })
      return
    }

    // Check token balance
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
      // Map form data to API format
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

      // Format time commitment from selected days
      const timeCommitment = selectedDays.length > 0
        ? `${selectedDays.length} day(s) per week: ${selectedDays.join(', ')}`
        : undefined

      // Format platforms
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
          goalsFreeText: goals,
          additionalNotes: notes || (platformsText ? `Platforms: ${platformsText}` : undefined),
          languages: selectedLanguages,
          tokensCost: totalTokens,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Failed to submit request')
      }

      const data = await response.json()
      const parsed = parseStartResponse(data)

      if (!parsed.ok) {
        throw new Error(parsed.message || 'Failed to start generation')
      }

      // Handle multi-language response (jobs array) or single job (backward-compatible)
      if (parsed.jobs && parsed.jobs.length > 0) {
        // Multi-language: store all jobs in state
        setActiveJobs(parsed.jobs)
        // Also update URL with first jobId for backward compatibility
        const tab = searchParams.get('tab') || 'custom'
        router.replace(`/learn?tab=${tab}&jobId=${parsed.jobs[0].jobId}`)
      } else if (parsed.jobId) {
        // Single job (backward-compatible)
        setActiveJobs([{ jobId: parsed.jobId, language: 'en' }])
        const tab = searchParams.get('tab') || 'custom'
        router.replace(`/learn?tab=${tab}&jobId=${parsed.jobId}`)
      } else {
        // If we have ok=true but no jobs/jobId, it's still an error
        throw new Error(parsed.message || 'No job ID received from server')
      }

      showToast({
        title: 'Request submitted',
        description: parsed.message || `Course generation started for ${parsed.jobs?.length || 1} language(s). You can close this window.`,
        variant: 'success',
      })

      // Don't reset form - user can modify and start new generation if needed
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: form */}
      <div className="lg:col-span-7 space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm sm:text-base font-semibold text-slate-50">{t('title')}</h2>
          <p className="text-xs sm:text-sm text-slate-300/90">{t('description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Experience */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('experience.label')}</span>
              <span className="text-[11px] text-slate-500">{tForm('experience.required')}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['beginner', 'intermediate', 'advanced'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExperience(key)}
                  className={`px-2.5 py-1 rounded-full border transition ${
                    experience === key
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`experience.options.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Markets */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('markets.label')}</span>
              <span className="text-[11px] text-slate-500">{tForm('markets.hint')}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['forex', 'crypto', 'binary'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleMarketToggle(key)}
                  className={`px-2.5 py-1 rounded-full border transition ${
                    markets.includes(key)
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`markets.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Deposit size */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('deposit.label')}</span>
              <span className="text-[11px] text-slate-500">{tForm('deposit.hint')}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'veryHigh'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeposit(key)}
                  className={`px-2.5 py-1.5 rounded-xl border transition text-[11px] ${
                    deposit === key
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`deposit.options.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Risk & style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center justify-between gap-2">
                <span className="text-slate-200">{tForm('risk.label')}</span>
                <span className="text-[11px] text-slate-500">{tForm('risk.hint')}</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['low', 'medium', 'high'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRiskTolerance(key)}
                    className={`px-2.5 py-1 rounded-full border transition ${
                      riskTolerance === key
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {tForm(`risk.${key}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center justify-between gap-2">
                <span className="text-slate-200">{tForm('style.label')}</span>
                <span className="text-[11px] text-slate-500">{tForm('style.hint')}</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['scalping', 'day', 'swing', 'position'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTradingStyle(key)}
                    className={`px-2.5 py-1 rounded-full border transition ${
                      tradingStyle === key
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {tForm(`style.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time available per week - Day selector */}
          <div className="space-y-1.5">
            <label className="text-slate-200">{tForm('time.label')}</label>
            <div className="flex flex-wrap gap-1.5">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`px-2.5 py-1 rounded-full border transition text-[11px] ${
                    selectedDays.includes(day)
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`time.days.${day.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms / brokers - Multi-select */}
          <div className="space-y-1.5">
            <label className="text-slate-200">{tForm('platforms.label')}</label>
            <div className="flex flex-wrap gap-1.5">
              {availablePlatforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformToggle(platform)}
                  className={`px-2.5 py-1 rounded-full border transition text-[11px] ${
                    selectedPlatforms.includes(platform)
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('goals.label')}</span>
              <span className="text-[11px] text-slate-500">{tForm('goals.hint')}</span>
            </label>
            <textarea
              rows={4}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none resize-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder={tForm('goals.placeholder')}
            />
          </div>

          {/* Extra notes */}
          <div className="space-y-1.5">
            <label className="text-slate-200">{tForm('notes.label')}</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none resize-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder={tForm('notes.placeholder')}
            />
          </div>

          {/* Language selection */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('language.label')}</span>
              <span className="text-[11px] text-slate-500">{tForm('language.required')}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['en', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageToggle(lang)}
                  className={`px-2.5 py-1 rounded-full border transition ${
                    selectedLanguages.includes(lang)
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`language.${lang}`)}
                </button>
              ))}
            </div>
            {selectedLanguages.length === 2 && (
              <p className="text-[11px] text-slate-400">{tForm('language.hint')}</p>
            )}
          </div>

          {/* Consents */}
          <div className="space-y-2 text-[11px] text-slate-300">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consentEducation}
                onChange={(e) => setConsentEducation(e.target.checked)}
                className="mt-0.5 h-3 w-3 rounded border border-slate-600 bg-slate-950 text-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <span>{tForm('consents.education')}</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-0.5 h-3 w-3 rounded border border-slate-600 bg-slate-950 text-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <span className="text-[11px] text-slate-300">
                {tForm('consents.termsBefore')}{' '}
                <Link href="/terms" className="text-cyan-300 hover:text-cyan-200 underline">
                  {tForm('consents.termsLink')}
                </Link>{' '}
                {tForm('consents.termsAnd')}{' '}
                <Link href="/risk-and-disclaimer" className="text-cyan-300 hover:text-cyan-200 underline">
                  {tForm('consents.riskLink')}
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Price Calculator */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Coins className="w-4 h-4 text-cyan-300" />
              <span className="font-semibold">{tForm('calculator.title')}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-slate-400">{tForm('calculator.total')}</span>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-300">
                  {totalTokens.toLocaleString('en-US')} {tForm('calculator.tokens')}
                </div>
                <div className="text-[11px] text-slate-400">
                  ≈ {formattedPrice}
                </div>
              </div>
            </div>
            {session && (
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{tForm('calculator.balance')}</span>
                  <span className={`font-medium ${hasEnoughTokens ? 'text-green-400' : 'text-amber-400'}`}>
                    {userBalance.toLocaleString('en-US')} {tForm('calculator.tokens')}
                  </span>
                </div>
                {!hasEnoughTokens && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-[11px] text-amber-200">
                      {tForm('calculator.insufficientBalance.message')}
                    </p>
                    <Link
                      href="/top-up"
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      {tForm('calculator.insufficientBalance.topUp')}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isGenerateDisabled}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{tForm('submit')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              {hasActiveJob && !showNewGenerationConfirm && (
                <button
                  type="button"
                  onClick={handleStartNewGeneration}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                >
                  Start new generation
                </button>
              )}
              {showNewGenerationConfirm && (
                <div className="flex items-center gap-2 text-[11px] text-amber-200">
                  <span>This will start a new task and replace the current one.</span>
                  <button
                    type="button"
                    onClick={handleConfirmNewGeneration}
                    className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewGenerationConfirm(false)}
                    className="px-2 py-1 rounded bg-slate-700 border border-slate-600 hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-400">{tForm('delivery')}</p>
            </div>

            {/* Job Status UI - Support multiple jobs */}
            {activeJobs.length > 0 ? (
              <div className="space-y-2">
                {activeJobs.map((job) => (
                  <JobStatusBlock
                    key={job.jobId}
                    jobId={job.jobId}
                    language={job.language}
                    jobType="custom-course"
                    onClear={activeJobs.length === 1 ? handleClearJobId : undefined}
                  />
                ))}
                {activeJobs.length > 1 && (
                  <button
                    type="button"
                    onClick={handleClearJobId}
                    className="text-[10px] text-slate-400 hover:text-slate-200 transition w-full text-center"
                  >
                    Clear all
                  </button>
                )}
              </div>
            ) : (
              jobIdFromUrl &&
              jobStatus && (
                <JobStatusBlock
                  jobId={jobIdFromUrl}
                  language="en"
                  jobType="custom-course"
                  onClear={handleClearJobId}
                />
              )
            )}
          </div>
        </form>
      </div>

      {/* RIGHT: explainer / risk / pricing note */}
      <div className="lg:col-span-5 space-y-4">
        <motion.div
          className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 w-max">
            <Clock className="w-3 h-3 text-cyan-300" />
            <span>{tSidebar('delivery.badge')}</span>
          </div>
          <p className="text-[11px] text-slate-300/90">{tSidebar('delivery.description')}</p>
          <ul className="text-[11px] text-slate-300/90 space-y-1.5">
            <li>{tSidebar('delivery.points.modules')}</li>
            <li>{tSidebar('delivery.points.examples')}</li>
            <li>{tSidebar('delivery.points.checklist')}</li>
          </ul>
        </motion.div>

        <motion.div
          className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-2"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">{tSidebar('risk.title')}</span>
          </div>
          <p className="text-[11px] text-slate-100/90">{tSidebar('risk.description')}</p>
          <Link
            href="/risk-and-disclaimer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 mt-1"
          >
            <span>{tSidebar('risk.link')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        <motion.div
          className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <h3 className="text-xs font-semibold text-slate-50 mb-1">{tSidebar('pricing.title')}</h3>
          <p className="text-[11px] text-slate-300/90">{tSidebar('pricing.description')}</p>
          <ul className="text-[11px] text-slate-300/90 space-y-1.5">
            <li>{tSidebar('pricing.points.tokens')}</li>
            <li>{tSidebar('pricing.points.currencies')}</li>
          </ul>
          <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 w-max">
            <Layers className="w-3 h-3 text-cyan-300" />
            <span>{tSidebar('pricing.badge')}</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

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

  // Read jobId(s) from URL or state
  const jobIdFromUrl = searchParams.get('jobId') || undefined
  const [activeJobs, setActiveJobs] = useState<Array<{ jobId: string; language: string }>>([])
  
  // For backward compatibility: if we have URL jobId but no activeJobs, use it
  useEffect(() => {
    if (jobIdFromUrl && activeJobs.length === 0) {
      setActiveJobs([{ jobId: jobIdFromUrl, language: 'en' }])
    }
  }, [jobIdFromUrl, activeJobs.length])
  
  // For backward compatibility: use first job as main jobStatus if only one job
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

  // Map experienceYears, depositBudget, riskTolerance, markets, tradingStyle for pricing
  // These fields are required by API but may not be visible in UI
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

  // Calculate price based on selections
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

  // Check if there's an active job (not terminal)
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
    // Continue with normal submit flow - jobId will be replaced in handleSubmit
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

    // Validate required fields
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

    // Check token balance
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
          market,
          timeframe,
          riskPerTrade,
          maxTrades,
          instruments,
          focus,
          detailLevel,
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

      // Handle multi-language response (jobs array) or single job (backward-compatible)
      if (parsed.jobs && parsed.jobs.length > 0) {
        // Multi-language: store all jobs in state
        setActiveJobs(parsed.jobs)
        // Also update URL with first jobId for backward compatibility
        const tab = searchParams.get('tab') || 'ai'
        router.replace(`/learn?tab=${tab}&jobId=${parsed.jobs[0].jobId}`)
      } else if (parsed.jobId) {
        // Single job (backward-compatible)
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

      // Don't reset form - user can modify and start new generation if needed
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: form */}
      <div className="lg:col-span-7 space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm sm:text-base font-semibold text-slate-50">{t('title')}</h2>
          <p className="text-xs sm:text-sm text-slate-300/90">{t('description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Presets */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('presets.label')}</span>
              <span className="text-slate-500">{tForm('presets.hint')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['conservative', 'balanced', 'scalping'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(key)}
                  className={`px-2.5 py-1.5 rounded-full border transition ${
                    preset === key
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`presets.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Core profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-200">{tForm('market.label')}</label>
              <select
                value={market}
                onChange={(e) =>
                  setMarket(e.target.value as 'forex' | 'crypto' | 'binary')
                }
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
              >
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="binary">Binary options</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-200">{tForm('timeframe.label')}</label>
              <select
                value={timeframe}
                onChange={(e) =>
                  setTimeframe(e.target.value as 'M15' | 'M30' | 'H1' | 'H4' | 'D1')
                }
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
              >
                <option value="M15">M15</option>
                <option value="M30">M30</option>
                <option value="H1">H1</option>
                <option value="H4">H4</option>
                <option value="D1">D1</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-200">{tForm('risk.label')}</label>
              <input
                type="number"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                placeholder={tForm('risk.placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-200">{tForm('maxTrades.label')}</label>
              <input
                type="number"
                value={maxTrades}
                onChange={(e) => setMaxTrades(e.target.value)}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                placeholder={tForm('maxTrades.placeholder')}
              />
            </div>
          </div>

          {/* Instruments + notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-200">{tForm('instruments.label')}</label>
              <input
                type="text"
                value={instruments}
                onChange={(e) => setInstruments(e.target.value)}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                placeholder={tForm('instruments.placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-200">{tForm('focus.label')}</label>
              <input
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                placeholder={tForm('focus.placeholder')}
              />
            </div>
          </div>

          {/* Output options */}
          <div className="mt-4 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('detail.label')}</span>
              <span className="text-slate-500">{tForm('detail.hint')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['quick', 'standard', 'deep'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDetailLevel(key)}
                  className={`px-2.5 py-1.5 rounded-full border transition ${
                    detailLevel === key
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`detail.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Language selection */}
          <div className="mt-4 space-y-1.5">
            <label className="flex items-center justify-between gap-2">
              <span className="text-slate-200">{tForm('language.label')}</span>
              <span className="text-[11px] text-slate-500">{tForm('language.required')}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['en', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageToggle(lang)}
                  className={`px-2.5 py-1 rounded-full border transition ${
                    selectedLanguages.includes(lang)
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tForm(`language.${lang}`)}
                </button>
              ))}
            </div>
            {selectedLanguages.length === 2 && (
              <p className="text-[11px] text-slate-400">{tForm('language.hint')}</p>
            )}
          </div>

          {/* Consents */}
          <div className="mt-4 space-y-2 text-[11px] text-slate-300">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-3 w-3 rounded border border-slate-600 bg-slate-950 text-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <span>{tForm('consent')}</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-0.5 h-3 w-3 rounded border border-slate-600 bg-slate-950 text-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <span className="text-[11px] text-slate-300">
                {tForm('consentTermsBefore')}{' '}
                <Link href="/terms" className="text-cyan-300 hover:text-cyan-200 underline">
                  {tForm('consentTermsLink')}
                </Link>{' '}
                {tForm('consentTermsAnd')}{' '}
                <Link href="/risk-and-disclaimer" className="text-cyan-300 hover:text-cyan-200 underline">
                  {tForm('consentRiskLink')}
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Price Calculator */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Coins className="w-4 h-4 text-cyan-300" />
              <span className="font-semibold">{tForm('calculator.title')}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-slate-400">{tForm('calculator.total')}</span>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-300">
                  {totalTokens.toLocaleString('en-US')} {tForm('calculator.tokens')}
                </div>
                <div className="text-[11px] text-slate-400">
                  ≈ {formattedPrice}
                </div>
              </div>
            </div>
            {session && (
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{tForm('calculator.balance')}</span>
                  <span className={`font-medium ${hasEnoughTokens ? 'text-green-400' : 'text-amber-400'}`}>
                    {userBalance.toLocaleString('en-US')} {tForm('calculator.tokens')}
                  </span>
                </div>
                {!hasEnoughTokens && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-[11px] text-amber-200">
                      {tForm('calculator.insufficientBalance.message')}
                    </p>
                    <Link
                      href="/top-up"
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      {tForm('calculator.insufficientBalance.topUp')}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CTA + preview note */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!consent || !consentTerms || isGenerateDisabled}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>{tForm('submit')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              {hasActiveJob && !showNewGenerationConfirm && (
                <button
                  type="button"
                  onClick={handleStartNewGeneration}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                >
                  Start new generation
                </button>
              )}
              {showNewGenerationConfirm && (
                <div className="flex items-center gap-2 text-[11px] text-amber-200">
                  <span>This will start a new task and replace the current one.</span>
                  <button
                    type="button"
                    onClick={handleConfirmNewGeneration}
                    className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewGenerationConfirm(false)}
                    className="px-2 py-1 rounded bg-slate-700 border border-slate-600 hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-400">{tForm('output')}</p>
            </div>

            {/* Job Status UI - Support multiple jobs */}
            {activeJobs.length > 0 ? (
              <div className="space-y-2">
                {activeJobs.map((job) => (
                  <JobStatusBlock
                    key={job.jobId}
                    jobId={job.jobId}
                    language={job.language}
                    jobType="ai-strategy"
                    onClear={activeJobs.length === 1 ? handleClearJobId : undefined}
                  />
                ))}
                {activeJobs.length > 1 && (
                  <button
                    type="button"
                    onClick={handleClearJobId}
                    className="text-[10px] text-slate-400 hover:text-slate-200 transition w-full text-center"
                  >
                    Clear all
                  </button>
                )}
              </div>
            ) : (
              jobIdFromUrl &&
              jobStatus && (
                <JobStatusBlock
                  jobId={jobIdFromUrl}
                  language="en"
                  jobType="ai-strategy"
                  onClear={handleClearJobId}
                />
              )
            )}
          </div>

        </form>
      </div>

      {/* RIGHT: info cards */}
      <div className="lg:col-span-5 space-y-4">
        <motion.div
          className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 w-max">
            <SlidersHorizontal className="w-3 h-3 text-cyan-300" />
            <span>{tSidebar('depth.badge')}</span>
          </div>
          <p className="text-[11px] text-slate-300/90">{tSidebar('depth.description')}</p>
        </motion.div>

        <motion.div
          className="bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col gap-2"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <h3 className="text-xs font-semibold text-slate-50 mb-1">{tSidebar('courses.title')}</h3>
          <p className="text-[11px] text-slate-300/90">{tSidebar('courses.description')}</p>
        </motion.div>

        <motion.div
          className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-2"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">{tSidebar('risk.title')}</span>
          </div>
          <p className="text-[11px] text-slate-100/90">{tSidebar('risk.description')}</p>
          <Link
            href="/risk-and-disclaimer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 mt-1"
          >
            <span>{tSidebar('risk.link')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

