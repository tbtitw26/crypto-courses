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
      {/* Dark catalog hero */}
      <section className="bg-surface-900 pb-10 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.resources')}</span>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
                <FolderKanban className="h-6 w-6 text-brand-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{t('hero.title')}</h1>
              <p className="max-w-lg text-sm leading-relaxed text-surface-400">{t('hero.subtitle')}</p>
              <div className="grid grid-cols-1 gap-3 text-xs text-surface-400 sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <span>{t('hero.features.checklists')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <span>{t('hero.features.templates')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Brain className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <span>{t('hero.features.behaviour')}</span>
                </div>
              </div>
            </div>

            {/* Context panel */}
            <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-5 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-400" />
                <div>
                  <p className="text-xs font-semibold text-white">{t('hero.sideCard.title')}</p>
                  <p className="text-xs text-surface-500">{t('hero.sideCard.subtitle')}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-surface-400">{t('hero.sideCard.paragraph1')}</p>
              <p className="mt-2 text-xs leading-relaxed text-surface-400">{t('hero.sideCard.paragraph2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk notice */}
      <section className="border-b border-surface-200 bg-gold-50 py-4">
        <div className="mx-auto flex max-w-page items-center gap-3 px-4 sm:px-6 lg:px-8">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold-600" />
          <p className="flex-1 text-xs text-text-secondary">
            {t('resources.disclaimer')}
          </p>
        </div>
      </section>

      {/* Resource catalog — stacked cards */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-main sm:text-xl">{t('resources.title')}</h2>
            <p className="mt-1 max-w-xl text-sm sm:text-base text-text-secondary">{t('resources.subtitle')}</p>
          </div>

          <div className="space-y-4">
            {resources.map((item) => {
              const href = getResourceHref(item.title)
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-surface-200 bg-white p-5 shadow-card"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-surface-200 bg-surface-50">
                      {getResourceIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                        <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                          {typeLabel(item.type)}
                        </span>
                        {item.tag && (
                          <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="mb-1 text-xs text-text-muted">{item.subtitle}</p>
                      )}
                      <p className="text-xs leading-relaxed text-text-secondary">{item.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-text-muted">
                        <span>{item.format}</span>
                        <span className="hidden h-3 w-px bg-surface-200 sm:block" />
                        <span>{item.focus}</span>
                      </div>
                    </div>
                    <div className="shrink-0 sm:self-center">
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
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Integration info cards */}
      <section className="border-t border-surface-200 bg-white py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.useWithCourses.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('infoCards.useWithCourses.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('infoCards.useWithCourses.description')}</p>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.buildRoutines.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('infoCards.buildRoutines.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('infoCards.buildRoutines.description')}</p>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('infoCards.focusBehaviour.title')}</h3>
              </div>
              <p className="mb-1 text-xs text-text-muted">{t('infoCards.focusBehaviour.subtitle')}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{t('infoCards.focusBehaviour.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-card md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 text-sm sm:text-base text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
