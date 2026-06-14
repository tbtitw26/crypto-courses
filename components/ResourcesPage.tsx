'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ClipboardList,
  Target,
  Brain,
  FolderKanban,
  Info,
  Download,
  Layers,
  Activity,
  BookOpen,
  Compass,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'

interface ResourceItem {
  type: 'checklist' | 'template' | 'worksheet'
  title: string
  subtitle?: string
  description: string
  format: string
  focus: string
  tag?: string
  cta?: string
}

export function ResourcesPage() {
  const t = useTranslations('resources')
  const tBreadcrumb = useTranslations('courses.breadcrumb')

  const resources = (t.raw('resources') as any)?.items as ResourceItem[]

  const getResourceIcon = (type: string) => {
    if (type === 'checklist') {
      return <ClipboardList className="h-4 w-4 text-brand-600" />
    }
    if (type === 'template') {
      return <Layers className="h-4 w-4 text-brand-600" />
    }
    if (type === 'worksheet') {
      return <Activity className="h-4 w-4 text-brand-600" />
    }
    return null
  }

  const getResourceHref = (title: string): string | null => {
    const routeMap: Record<string, string> = {
      'Risk Management Foundations': '/learn/risk-management',
      'Daily Trade Journal Principles': '/learn/trade-journal',
      'Weekly Review Playbook': '/learn/weekly-review',
      'Pre-Session Preparation': '/learn/pre-session',
      'Position Sizing Made Simple': '/learn/position-sizing',
      'Strategy Snapshot Overview': '/learn/strategy-snapshot',
    }
    return routeMap[title] || null
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'checklist':
        return 'Checklist'
      case 'template':
        return 'Template'
      case 'worksheet':
        return 'Worksheet'
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen">
      {/* Light hero — full width */}
      <section className="border-b border-surface-200 bg-white pb-8 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-1 text-xs text-text-muted">
            <Link href="/" className="transition hover:text-text-main">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-text-secondary">{t('breadcrumb.resources')}</span>
          </div>

          {/* Icon */}
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50">
            <FolderKanban className="h-5 w-5 text-brand-600" />
          </div>

          {/* Title + subtitle */}
          <h1 className="text-2xl font-semibold text-text-main sm:text-3xl">{t('hero.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
            {t('hero.subtitle')}
          </p>

          {/* Feature pills inline */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs text-text-secondary">
              <ClipboardList className="h-3.5 w-3.5 text-brand-500" />
              {t('hero.features.checklists')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs text-text-secondary">
              <Target className="h-3.5 w-3.5 text-brand-500" />
              {t('hero.features.templates')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs text-text-secondary">
              <Brain className="h-3.5 w-3.5 text-brand-500" />
              {t('hero.features.behaviour')}
            </span>
          </div>

          {/* Side card content as inline callout + risk notice */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-6">
            <div className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-brand-500" />
                <p className="text-xs font-semibold text-text-main">{t('hero.sideCard.title')}</p>
                <span className="text-xs text-text-muted">{t('hero.sideCard.subtitle')}</span>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">{t('hero.sideCard.paragraph1')}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t('hero.sideCard.paragraph2')}</p>
            </div>

            {/* Risk notice — subtle inline */}
            <div className="flex shrink-0 items-start gap-2 rounded-lg border border-gold-200 bg-gold-50/60 px-4 py-3 sm:max-w-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
              <p className="text-xs leading-relaxed text-text-muted">
                {t('resources.disclaimer')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resource catalog — 2-column grid */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-main sm:text-xl">{t('resources.title')}</h2>
            <p className="mt-1 max-w-xl text-sm text-text-secondary sm:text-base">{t('resources.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resources.map((item) => {
              const href = getResourceHref(item.title)
              return (
                <div
                  key={item.title}
                  className="flex flex-col rounded-xl border border-surface-200 bg-white p-5 shadow-card"
                >
                  {/* Type badge + tag */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                      {getResourceIcon(item.type)}
                      <span>{typeLabel(item.type)}</span>
                    </span>
                    {item.tag && (
                      <span className="rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                  {item.subtitle && (
                    <p className="mt-0.5 text-xs text-text-muted">{item.subtitle}</p>
                  )}

                  {/* Description */}
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-text-secondary">{item.description}</p>

                  {/* Format / focus */}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-text-muted">
                    <span>{item.format}</span>
                    <span className="h-3 w-px bg-surface-200" />
                    <span>{item.focus}</span>
                  </div>

                  {/* CTA at bottom */}
                  <div className="mt-4">
                    {item.cta ? (
                      href ? (
                        <Link
                          href={href}
                          className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium"
                        >
                          <span>{item.cta}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <button type="button" className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium">
                          <span>{item.cta}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )
                    ) : (
                      <button type="button" className="btn-secondary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium">
                        <Download className="h-3.5 w-3.5" />
                        <span>{t('resources.downloadPreview')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Info strip — single horizontal row */}
      <section className="border-t border-surface-200 bg-white py-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-surface-200 rounded-xl border border-surface-200 bg-surface-50 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="px-5 py-4">
              <div className="mb-1.5 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.useWithCourses.title')}</h3>
              </div>
              <p className="text-[11px] text-text-muted">{t('infoCards.useWithCourses.subtitle')}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t('infoCards.useWithCourses.description')}</p>
            </div>

            <div className="px-5 py-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Compass className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.buildRoutines.title')}</h3>
              </div>
              <p className="text-[11px] text-text-muted">{t('infoCards.buildRoutines.subtitle')}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t('infoCards.buildRoutines.description')}</p>
            </div>

            <div className="px-5 py-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Brain className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.focusBehaviour.title')}</h3>
              </div>
              <p className="text-[11px] text-text-muted">{t('infoCards.focusBehaviour.subtitle')}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t('infoCards.focusBehaviour.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — asymmetric layout */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-6 rounded-xl border border-surface-200 bg-white p-6 shadow-card lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 text-sm text-text-secondary sm:text-base">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-2 lg:justify-end">
              <Link href="/courses" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold">
                {t('cta.browseCourses')}
              </Link>
              <Link href="/learn?tab=ai" className="btn-secondary rounded-lg px-5 py-2.5 text-sm">
                {t('cta.generateAI')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
