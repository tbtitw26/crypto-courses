'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Calculator,
  CheckCircle2,
  HelpCircle,
  ListChecks,
  PieChart,
  Ruler,
  ShieldCheck,
} from 'lucide-react'

export function PositionSizingPage() {
  const t = useTranslations('learn.positionSizing')
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
            <span className="font-medium text-text-main">{t('breadcrumb.positionSizing')}</span>
          </nav>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
                  <PieChart className="h-5 w-5" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold-700">{hero?.badges?.educationOnly}</span>
                  <span className="rounded-md border border-surface-200 bg-surface-100 px-2 py-0.5 text-xs font-medium text-text-muted">{hero?.badges?.worksTogether}</span>
                </div>
              </div>
              <h1 className="font-heading text-3xl font-semibold leading-tight text-text-main sm:text-4xl">{hero?.title}</h1>
              <p className="mt-3 text-base leading-relaxed text-text-secondary sm:text-lg">{hero?.subtitle}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2.5 rounded-xl border border-surface-200 bg-surface-0 px-4 py-2.5">
                <Calculator className="h-4 w-4 text-brand-600" />
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
        {/* Why Size Matters */}
        <div className="mb-14">
          <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.whySizeMatters?.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.whySizeMatters?.description1}</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.whySizeMatters?.question} <span className="font-semibold text-text-main">{sections?.whySizeMatters?.questionHighlight}</span></p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections?.whySizeMatters?.points?.map((p: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl border border-surface-200 bg-surface-0 p-4 text-sm text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-muted">{sections?.whySizeMatters?.note}</p>
        </div>

        {/* Core Formula — prominent formula card */}
        <div className="mb-14">
          <div className="mb-6 flex items-center gap-2.5">
            <Ruler className="h-5 w-5 text-brand-700" />
            <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.coreFormula?.title}</h2>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.coreFormula?.description}</p>

          {/* Formula display */}
          <div className="mb-6 rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-6 text-center lg:p-8">
            <p className="font-mono text-lg font-bold text-brand-800 sm:text-xl">{sidebar?.simplifiedFormula?.formula}</p>
            <p className="mt-2 text-sm text-brand-600">{sidebar?.simplifiedFormula?.description}</p>
            <p className="mt-1 text-xs text-text-muted">{sidebar?.simplifiedFormula?.note}</p>
          </div>

          {/* Formula components */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[sections?.coreFormula?.riskAmount, sections?.coreFormula?.distanceToStop, sections?.coreFormula?.valuePerUnit].map((card: any, i: number) => (
              <div key={i} className="relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
                <span className="absolute right-3 top-2 font-heading text-4xl font-bold text-surface-100">{String(i + 1).padStart(2, '0')}</span>
                <p className="relative mb-2 font-heading text-sm font-semibold text-text-main">{card?.title}</p>
                <p className="relative text-sm leading-relaxed text-text-secondary">{card?.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-text-secondary">{sections?.coreFormula?.conclusion}</p>
        </div>

        {/* Forex Example — calculation walkthrough */}
        <div className="mb-14 rounded-2xl border border-surface-200 bg-white shadow-card">
          <div className="flex items-center gap-2.5 border-b border-surface-200 px-6 py-4">
            <Activity className="h-4 w-4 text-brand-700" />
            <h2 className="font-heading text-base font-semibold text-text-main">{sections?.forexExample?.title}</h2>
          </div>
          <div className="px-6 py-5">
            <p className="mb-5 text-sm text-text-secondary">{sections?.forexExample?.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-700">{sections?.forexExample?.conceptFlow?.title}</p>
                <ol className="space-y-2">{sections?.forexExample?.conceptFlow?.steps?.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}</ol>
                <p className="mt-3 text-xs text-text-muted">{sections?.forexExample?.conceptFlow?.note}</p>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-0 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">{sections?.forexExample?.whyExamples?.title}</p>
                <p className="text-sm leading-relaxed text-text-secondary">{sections?.forexExample?.whyExamples?.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crypto & Binary Notes */}
        <div className="mb-14 grid gap-4 sm:grid-cols-2">
          {[sections?.cryptoBinaryNotes?.cryptoMargin, sections?.cryptoBinaryNotes?.binaryPayoffs].map((card: any, i: number) => (
            <div key={i} className="rounded-2xl border border-surface-200 bg-white shadow-card">
              <div className="flex items-center gap-2.5 border-b border-surface-200 px-6 py-4">
                <ArrowRightLeft className="h-4 w-4 text-brand-700" />
                <h3 className="font-heading text-sm font-semibold text-text-main">{card?.title}</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed text-text-secondary">{card?.description}</p>
                <p className="mt-3 text-xs text-text-muted">{card?.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Behaviour & Consistency — numbered step cards */}
        <div className="mb-14">
          <div className="mb-4 flex items-center gap-2.5">
            <ListChecks className="h-5 w-5 text-brand-700" />
            <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.behaviourConsistency?.title}</h2>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.behaviourConsistency?.description}</p>
          <div className="space-y-3">
            {sections?.behaviourConsistency?.steps?.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border border-surface-200 border-l-[3px] border-l-brand-500 bg-white p-4 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-heading text-sm font-bold text-brand-700">{i + 1}</span>
                <p className="pt-0.5 text-sm leading-relaxed text-text-secondary">{s}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">{sections?.behaviourConsistency?.note}</p>
        </div>

        {/* Pitfalls Warning */}
        <div className="mb-10 rounded-2xl border border-gold-200 bg-gold-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gold-800">{sidebar?.pitfalls?.title}</p>
              <ul className="mt-3 space-y-2">{sidebar?.pitfalls?.items?.map((it: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gold-800/80">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" /><span>{it}</span>
                </li>
              ))}</ul>
              <p className="mt-3 text-xs text-gold-700">{sidebar?.pitfalls?.note}</p>
            </div>
          </div>
        </div>

        {/* Platform Note */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-surface-200 bg-surface-0 px-5 py-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div>
            <p className="text-xs font-semibold text-text-main">{sidebar?.platformNote?.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{sidebar?.platformNote?.description}</p>
            <p className="mt-1 text-xs text-text-muted">{sidebar?.platformNote?.note}</p>
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
            <Link href="/learn/risk-management" className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-surface-0">
              <ShieldCheck className="h-4 w-4 text-brand-600" /> Risk Management
            </Link>
            <Link href="/learn/trade-journal" className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-surface-0">
              <PieChart className="h-4 w-4 text-brand-600" /> Trade Journal
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
