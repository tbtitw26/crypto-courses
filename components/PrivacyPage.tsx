'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Info, FileText, Shield, Lock, AlertTriangle, ChevronDown } from 'lucide-react'

type SummaryCard = {
  title: string
  subtitle: string
  items: string[]
  note: string
}

type HeroMeta = {
  label: string
  value: string
}[]

type TocItem = {
  label: string
  anchor: string
}

type Toc = {
  title: string
  items: TocItem[]
  reminder: {
    label: string
    text: string
  }
}

type DefinitionItem = {
  term: string
  description: string
}

type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'definition'; items: DefinitionItem[] }
  | { type: 'note'; text: string }

type PrivacySection = {
  id: string
  number: string
  title: string
  accent?: 'default' | 'warning'
  content: ContentBlock[]
}

export function PrivacyPage() {
  const t = useTranslations('privacy')
  const tBreadcrumb = useTranslations('courses.breadcrumb')

  const summaryCard = (t.raw('hero.summaryCard') as SummaryCard) || null
  const heroMeta = (Array.isArray(t.raw('hero.meta')) ? (t.raw('hero.meta') as HeroMeta) : []) || []
  const toc = (t.raw('toc') as Toc) || null
  const sections = (Array.isArray(t.raw('sections')) ? (t.raw('sections') as PrivacySection[]) : []) || []

  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const renderContentBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'list':
        return (
          <ul key={`list-${idx}`} className="space-y-1.5 pl-5 text-sm text-text-secondary">
            {block.items.map((item, itemIdx) => (
              <li key={itemIdx} className="relative before:absolute before:-left-3 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-surface-400">
                {item}
              </li>
            ))}
          </ul>
        )
      case 'definition':
        return (
          <div key={`def-${idx}`} className="rounded-lg border border-surface-200 bg-surface-50 p-4">
            <dl className="space-y-3">
              {block.items.map((item, defIdx) => (
                <div key={defIdx}>
                  <dt className="text-sm font-semibold text-text-main">{item.term}</dt>
                  <dd className="text-sm text-text-secondary">{item.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        )
      case 'note':
        return (
          <div key={`note-${idx}`} className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            <span>{block.text}</span>
          </div>
        )
      case 'paragraph':
      default:
        return (
          <p key={`p-${idx}`} className="text-sm leading-relaxed text-text-secondary">
            {block.type === 'paragraph' ? block.text : (block as any)}
          </p>
        )
    }
  }

  return (
    <div className="min-h-screen">
      {/* Light privacy hero with gradient band */}
      <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
      <section className="bg-white pb-10 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-text-muted">
            <Link href="/" className="transition hover:text-text-secondary">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-text-secondary">{t('breadcrumb.privacy')}</span>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-200 bg-brand-50">
                <Lock className="h-6 w-6 text-brand-600" />
              </div>
              <h1 className="text-2xl font-semibold text-text-main sm:text-3xl">{t('hero.title')}</h1>
              <p className="max-w-lg text-sm leading-relaxed text-text-secondary">{t('hero.subtitle')}</p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {Array.isArray(heroMeta) && heroMeta.length > 0
                  ? heroMeta.map((meta) => (
                      <span key={meta.label} className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-text-secondary">
                        <Shield className="h-3 w-3 text-brand-600" />
                        <span className="text-text-muted">{meta.label}:</span>
                        <span>{meta.value}</span>
                      </span>
                    ))
                  : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-text-secondary">
                  <Lock className="h-3 w-3 text-brand-600" />
                  {t('hero.badges.dataProtection')}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-text-secondary">
                  <FileText className="h-3 w-3 text-brand-600" />
                  {t('hero.badges.ukGdpr')}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {t('hero.badges.ageRestriction')}
                </span>
              </div>
            </div>

            {/* Summary side panel */}
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-xs font-semibold text-text-main">{summaryCard?.title}</p>
                  <p className="text-xs text-text-muted">{summaryCard?.subtitle}</p>
                </div>
              </div>
              <ul className="mb-3 space-y-1.5 text-xs text-text-secondary">
                {summaryCard?.items && Array.isArray(summaryCard.items)
                  ? summaryCard.items.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        {item}
                      </li>
                    ))
                  : null}
              </ul>
              {summaryCard?.note && <p className="text-xs text-text-muted">{summaryCard.note}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar TOC + Content — two-column document layout */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
            {/* Sidebar TOC */}
            <aside className="lg:col-span-1">
              {/* Mobile TOC toggle */}
              <button
                type="button"
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                aria-expanded={mobileTocOpen}
                className="flex w-full items-center justify-between rounded-xl border border-surface-200 bg-white p-4 shadow-card lg:hidden"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-semibold text-text-main">{toc?.title}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${mobileTocOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileTocOpen && (
                <div className="mt-2 rounded-xl border border-surface-200 bg-white p-4 shadow-card lg:hidden">
                  <ul className="space-y-2 text-xs">
                    {toc?.items && Array.isArray(toc.items)
                      ? toc.items.map((item, idx: number) => (
                          <li key={item.anchor}>
                            <a href={`#${item.anchor}`} className="flex items-start gap-1.5 text-text-secondary transition hover:text-brand-600">
                              <span className="text-text-muted">{idx + 1}.</span>
                              {item.label}
                            </a>
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
              )}

              {/* Desktop sticky TOC */}
              <div className="sticky top-24 hidden space-y-4 lg:block">
                <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-600" />
                    <span className="text-xs font-semibold text-text-main">{toc?.title}</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {toc?.items && Array.isArray(toc.items)
                      ? toc.items.map((item, idx: number) => (
                          <li key={item.anchor}>
                            <a href={`#${item.anchor}`} className="flex items-start gap-1.5 text-text-secondary transition hover:text-brand-600">
                              <span className="text-text-muted">{idx + 1}.</span>
                              {item.label}
                            </a>
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
                <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">{toc?.reminder?.label}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{toc?.reminder?.text}</p>
                </div>
              </div>
            </aside>

            {/* Content sections */}
            <div className="space-y-5 lg:col-span-3">
              {Array.isArray(sections) && sections.length > 0
                ? sections.map((section) => {
                    const isWarning = section.accent === 'warning'
                    return (
                      <article
                        key={section.id}
                        id={section.id}
                        className={`rounded-xl border p-5 sm:p-6 ${
                          isWarning
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-surface-200 bg-white shadow-card'
                        }`}
                      >
                        <div className="mb-4 flex items-center gap-2">
                          {isWarning && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                          <span className={`text-xs font-semibold ${isWarning ? 'text-amber-600' : 'text-text-muted'}`}>
                            {section.number}.
                          </span>
                          <h2 className={`text-sm font-semibold ${isWarning ? 'text-amber-900' : 'text-text-main'}`}>
                            {section.title}
                          </h2>
                        </div>
                        <div className="space-y-3">
                          {section.content && Array.isArray(section.content)
                            ? section.content.map((block, idx) => renderContentBlock(block, idx))
                            : null}
                        </div>
                      </article>
                    )
                  })
                : null}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-surface-200 bg-white py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-card md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
              <p className="mt-1 text-sm text-text-secondary">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold">
                {t('cta.backToHome')}
              </Link>
              <Link href="/contact" className="btn-secondary rounded-lg px-5 py-2.5 text-sm">
                {t('cta.contactPrivacy')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
