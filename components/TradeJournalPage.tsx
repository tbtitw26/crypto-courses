'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Info,
  ListChecks,
  PenSquare,
} from 'lucide-react'

export function TradeJournalPage() {
  const t = useTranslations('learn.tradeJournal')
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
            <span className="font-medium text-text-main">{t('breadcrumb.tradeJournal')}</span>
          </nav>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
                  <PenSquare className="h-5 w-5" />
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
                <PenSquare className="h-4 w-4 text-brand-600" />
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
        {/* Why Journal Matters */}
        <div className="mb-14">
          <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.whyJournalMatters?.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.whyJournalMatters?.description}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {sections?.whyJournalMatters?.points?.map((p: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-surface-200 bg-surface-0 p-4 text-sm text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>{p}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-muted">{sections?.whyJournalMatters?.note}</p>
        </div>

        {/* Entry Structure — document-style before/after */}
        <div className="mb-14">
          <div className="mb-6 flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-brand-700" />
            <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.entryStructure?.title}</h2>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.entryStructure?.description}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[sections?.entryStructure?.beforeTrade, sections?.entryStructure?.afterTrade].map((card: any, i: number) => (
              <div key={i} className="rounded-2xl border border-surface-200 bg-white shadow-card">
                <div className={`border-b px-5 py-3 ${i === 0 ? 'border-brand-200 bg-brand-50/50' : 'border-gold-200 bg-gold-50/50'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-brand-700' : 'text-gold-700'}`}>{card?.title}</p>
                </div>
                <ul className="space-y-2 px-5 py-4">
                  {card?.items?.map((it: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-400" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Keeping Entries Short — do/don't comparison */}
        <div className="mb-14 rounded-2xl border border-surface-200 bg-white shadow-card">
          <div className="flex items-center gap-2.5 border-b border-surface-200 px-6 py-4">
            <ListChecks className="h-4 w-4 text-brand-700" />
            <h2 className="font-heading text-base font-semibold text-text-main">{sections?.keepingEntriesShort?.title}</h2>
          </div>
          <div className="px-6 py-5">
            <p className="mb-5 text-sm text-text-secondary">{sections?.keepingEntriesShort?.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-700">{sections?.keepingEntriesShort?.usefulNotes?.title}</p>
                <ul className="space-y-2">{sections?.keepingEntriesShort?.usefulNotes?.items?.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" /><span>{it}</span>
                  </li>
                ))}</ul>
              </div>
              <div className="rounded-xl border border-surface-300 bg-surface-0 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">{sections?.keepingEntriesShort?.lessUsefulNotes?.title}</p>
                <ul className="space-y-2">{sections?.keepingEntriesShort?.lessUsefulNotes?.items?.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-400" /><span>{it}</span>
                  </li>
                ))}</ul>
              </div>
            </div>
            <p className="mt-4 text-xs text-text-muted">{sections?.keepingEntriesShort?.note}</p>
          </div>
        </div>

        {/* Daily Rhythm — horizontal flow */}
        <div className="mb-14">
          <div className="mb-6 flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-brand-700" />
            <h2 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">{sections?.dailyRhythm?.title}</h2>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-text-secondary">{sections?.dailyRhythm?.description}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[sections?.dailyRhythm?.beforeSession, sections?.dailyRhythm?.afterSession].map((card: any, i: number) => (
              <div key={i} className="relative rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
                <span className="absolute right-5 top-4 font-heading text-4xl font-bold text-surface-100">{i === 0 ? 'AM' : 'PM'}</span>
                <p className="relative mb-4 font-heading text-sm font-semibold text-text-main">{card?.title}</p>
                <ul className="relative space-y-2">{card?.items?.map((it: string, j: number) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" /><span>{it}</span>
                  </li>
                ))}</ul>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Review Link Section */}
        <div className="mb-14 rounded-2xl border border-surface-200 bg-white shadow-card">
          <div className="flex items-center gap-2.5 border-b border-surface-200 px-6 py-4">
            <Calendar className="h-4 w-4 text-brand-700" />
            <h2 className="font-heading text-base font-semibold text-text-main">{sections?.weeklyReview?.title}</h2>
          </div>
          <div className="px-6 py-5">
            <p className="mb-4 text-sm leading-relaxed text-text-secondary">{sections?.weeklyReview?.description}</p>
            <ol className="space-y-2">{sections?.weeklyReview?.steps?.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}</ol>
            <p className="mt-4 text-xs text-text-muted">{sections?.weeklyReview?.note}</p>
          </div>
        </div>

        {/* Journal Template Preview */}
        <div className="mb-10 rounded-2xl border border-surface-200 bg-surface-0 p-6 lg:p-8">
          <div className="mb-4 flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-brand-700" />
            <div>
              <h3 className="font-heading text-base font-semibold text-text-main">{sidebar?.template?.title}</h3>
            </div>
          </div>
          <p className="mb-4 text-sm text-text-secondary">{sidebar?.template?.description}</p>
          <div className="rounded-xl border border-brand-200 bg-white p-5">
            <div className="space-y-2 font-mono text-sm text-brand-800">
              {sidebar?.template?.fields?.map((field: string, i: number) => (
                <div key={i} className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2">{field}</div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">{sidebar?.template?.note}</p>
        </div>

        {/* Tips */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-surface-200 bg-surface-0 px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div>
            <p className="text-xs font-semibold text-text-main">{sidebar?.tips?.title}</p>
            <ul className="mt-2 space-y-1">{sidebar?.tips?.items?.map((it: string, i: number) => (
              <li key={i} className="text-sm leading-relaxed text-text-secondary">• {it}</li>
            ))}</ul>
          </div>
        </div>

        {/* Emotional Decisions Warning */}
        <div className="mb-10 rounded-2xl border border-gold-200 bg-gold-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gold-800">{sidebar?.emotionalDecisions?.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gold-800/80">{sidebar?.emotionalDecisions?.description}</p>
              <p className="mt-2 text-xs text-gold-700">{sidebar?.emotionalDecisions?.note}</p>
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
            <Link href="/learn/weekly-review" className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-surface-0">
              <Calendar className="h-4 w-4 text-brand-600" /> Weekly Review
            </Link>
            <Link href="/learn/pre-session" className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-surface-0">
              <BookOpen className="h-4 w-4 text-brand-600" /> Pre-Session
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
