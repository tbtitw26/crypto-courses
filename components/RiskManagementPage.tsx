'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  ListChecks,
  PieChart,
  ShieldCheck,
  Target,
} from 'lucide-react'

export function RiskManagementPage() {
  const t = useTranslations('learn.riskManagement')
  const tBreadcrumb = useTranslations('learn.breadcrumb')

  const hero = t.raw('hero') as any
  const sections = t.raw('sections') as any
  const sidebar = t.raw('sidebar') as any

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero ─── */}
      <section className="border-b border-surface-200 bg-gradient-to-b from-surface-0 to-white">
        <div className="mx-auto max-w-page px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pb-14 lg:pt-10">
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="transition-colors hover:text-brand-700">{tBreadcrumb('home')}</Link>
            <span>/</span>
            <Link href="/learn" className="transition-colors hover:text-brand-700">{tBreadcrumb('learn')}</Link>
            <span>/</span>
            <span className="font-medium text-text-main">{t('breadcrumb.riskManagement')}</span>
          </nav>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold-700">{hero?.badges?.educationOnly}</span>
                  <span className="rounded-md border border-surface-200 bg-surface-100 px-2 py-0.5 text-xs font-medium text-text-muted">{hero?.badges?.appliesTo}</span>
                </div>
              </div>
              <h1 className="font-heading text-3xl font-semibold leading-tight text-text-main sm:text-4xl">{hero?.title}</h1>
              <p className="mt-3 text-base leading-relaxed text-text-secondary sm:text-lg">{hero?.subtitle}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2.5 rounded-xl border border-surface-200 bg-surface-0 px-4 py-2.5">
                <BookOpen className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-xs font-semibold text-text-main">{hero?.conceptCard?.title}</p>
                  <p className="text-xs text-text-muted">{hero?.conceptCard?.subtitle}</p>
                </div>
              </div>
              <span className="text-xs text-text-muted">{hero?.readingTime}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Why Risk First */}
        <div className="mb-14">
          <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.whyRiskFirst?.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.whyRiskFirst?.description}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections?.whyRiskFirst?.points?.map((p: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl border border-surface-200 bg-surface-0 p-4 text-sm text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-muted">{sections?.whyRiskFirst?.note}</p>
        </div>

        {/* Three Pillars — numbered framework */}
        <div className="mb-14">
          <div className="mb-6 flex items-center gap-2.5">
            <PieChart className="h-5 w-5 text-brand-700" />
            <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.threePillars?.title}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {sections?.threePillars?.items?.map((item: any, i: number) => (
              <div key={i} className="relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
                <span className="absolute right-4 top-3 font-heading text-5xl font-bold text-surface-100">{String(i + 1).padStart(2, '0')}</span>
                <p className="relative mb-2 font-heading text-base font-semibold text-text-main">{item.title}</p>
                <p className="relative text-sm leading-relaxed text-text-secondary">{item.description}</p>
                {item.note && <p className="relative mt-3 text-xs text-text-muted">{item.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Account Risk + Risk Per Trade — two-panel */}
        <div className="mb-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-surface-200 bg-white shadow-card">
            <div className="flex items-center gap-2.5 border-b border-surface-200 px-6 py-4">
              <Activity className="h-4 w-4 text-brand-700" />
              <h2 className="font-heading text-base font-semibold text-text-main">{sections?.accountRisk?.title}</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-sm text-text-secondary">
              <p>{sections?.accountRisk?.description}</p>
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="mb-2 text-xs font-semibold text-brand-800">{sections?.accountRisk?.example?.title}</p>
                <p className="text-sm leading-relaxed text-brand-700/80">{sections?.accountRisk?.example?.text}</p>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-0 p-4">
                <p className="mb-3 text-xs font-semibold text-text-main">{sections?.accountRisk?.whyMatters?.title}</p>
                <ul className="space-y-1.5">{sections?.accountRisk?.whyMatters?.points?.map((p: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" /><span>{p}</span>
                  </li>
                ))}</ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white shadow-card">
            <div className="flex items-center gap-2.5 border-b border-surface-200 px-6 py-4">
              <Target className="h-4 w-4 text-brand-700" />
              <h2 className="font-heading text-base font-semibold text-text-main">{sections?.riskPerTrade?.title}</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-sm text-text-secondary">
              <p>{sections?.riskPerTrade?.description}</p>
              <div className="rounded-xl border border-surface-200 bg-surface-0 p-4">
                <p className="mb-3 text-xs font-semibold text-text-main">{sections?.riskPerTrade?.conceptualSteps?.title}</p>
                <ol className="space-y-2">{sections?.riskPerTrade?.conceptualSteps?.steps?.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}</ol>
                <p className="mt-3 text-xs text-text-muted">{sections?.riskPerTrade?.conceptualSteps?.note}</p>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-0 p-4">
                <p className="mb-2 text-xs font-semibold text-text-main">{sections?.riskPerTrade?.multiplePositions?.title}</p>
                <p className="text-sm leading-relaxed text-text-secondary">{sections?.riskPerTrade?.multiplePositions?.text}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily/Weekly Limits — do/don't split */}
        <div className="mb-14 rounded-2xl border border-surface-200 bg-white shadow-card">
          <div className="flex items-center gap-2.5 border-b border-surface-200 px-6 py-4">
            <Clock className="h-4 w-4 text-brand-700" />
            <h2 className="font-heading text-base font-semibold text-text-main">{sections?.dailyWeeklyLimits?.title}</h2>
          </div>
          <div className="px-6 py-5">
            <p className="mb-5 text-sm text-text-secondary">{sections?.dailyWeeklyLimits?.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-700">{sections?.dailyWeeklyLimits?.examples?.title}</p>
                <ul className="space-y-2">{sections?.dailyWeeklyLimits?.examples?.items?.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" /><span>{it}</span>
                  </li>
                ))}</ul>
                <p className="mt-3 text-xs text-text-muted">{sections?.dailyWeeklyLimits?.examples?.note}</p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-gold-50/50 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-700">{sections?.dailyWeeklyLimits?.traps?.title}</p>
                <ul className="space-y-2">{sections?.dailyWeeklyLimits?.traps?.items?.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" /><span>{it}</span>
                  </li>
                ))}</ul>
              </div>
            </div>
          </div>
        </div>

        {/* Turning Concepts Into Rules — numbered step cards */}
        <div className="mb-14">
          <div className="mb-4 flex items-center gap-2.5">
            <ListChecks className="h-5 w-5 text-brand-700" />
            <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.turningConcepts?.title}</h2>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.turningConcepts?.description}</p>
          <div className="space-y-3">
            {sections?.turningConcepts?.steps?.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border border-surface-200 border-l-[3px] border-l-brand-500 bg-white p-4 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-heading text-sm font-bold text-brand-700">{i + 1}</span>
                <p className="pt-0.5 text-sm leading-relaxed text-text-secondary">{s}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">{sections?.turningConcepts?.note}</p>
        </div>

        {/* Risk Checklist Module */}
        <div className="mb-10 rounded-2xl border border-surface-200 bg-surface-0 p-6 lg:p-8">
          <div className="mb-5 flex items-center gap-2.5">
            <ListChecks className="h-5 w-5 text-brand-700" />
            <div>
              <h3 className="font-heading text-base font-semibold text-text-main">{sidebar?.checklist?.title}</h3>
              <p className="text-xs text-text-muted">{sidebar?.checklist?.subtitle}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sidebar?.checklist?.items?.map((it: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-surface-200 bg-white p-3 text-sm text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /><span>{it}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Examples Note */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-surface-200 bg-surface-0 px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div>
            <p className="text-xs font-semibold text-text-main">{sidebar?.examplesNote?.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{sidebar?.examplesNote?.description}</p>
            <p className="mt-1 text-xs text-text-muted">{sidebar?.examplesNote?.warning}</p>
          </div>
        </div>

        {/* Risk Warning Banner */}
        <div className="mb-10 rounded-2xl border border-gold-200 bg-gold-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gold-800">{sidebar?.riskWarning?.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gold-800/80">{sidebar?.riskWarning?.description}</p>
              <p className="mt-2 text-xs text-gold-700">{sidebar?.riskWarning?.note}</p>
            </div>
          </div>
        </div>

        {/* Cross-navigation */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-brand-700" />
            <h3 className="font-heading text-sm font-semibold text-text-main">{sidebar?.continueLearning?.title}</h3>
          </div>
          <p className="mb-4 text-sm text-text-secondary">{sidebar?.continueLearning?.description}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sidebar?.continueLearning?.topics?.map((topic: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" /><span>{topic}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">{sidebar?.continueLearning?.note}</p>
          <div className="mt-5 flex flex-wrap gap-3 border-t border-surface-200 pt-5">
            <Link href="/learn/position-sizing" className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-surface-0">
              <PieChart className="h-4 w-4 text-brand-600" /> Position Sizing
            </Link>
            <Link href="/learn/trade-journal" className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-surface-0">
              <BookOpen className="h-4 w-4 text-brand-600" /> Trade Journal
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100">
              Explore Courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
