'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Info, FileText, Shield, CreditCard, AlertTriangle, LifeBuoy, ArrowRight, ChevronRight } from 'lucide-react'

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

type Section = {
  id: string
  number: string
  title: string
  accent?: 'default' | 'warning'
  content: ContentBlock[]
}

export function RefundPage() {
  const t = useTranslations('refund')
  const tBreadcrumb = useTranslations('courses.breadcrumb')

  const summaryCard = (t.raw('hero.summaryCard') as SummaryCard) || null
  const heroMeta = (Array.isArray(t.raw('hero.meta')) ? (t.raw('hero.meta') as HeroMeta) : []) || []
  const toc = (t.raw('toc') as Toc) || null
  const sections = (Array.isArray(t.raw('sections')) ? (t.raw('sections') as Section[]) : []) || []

  const renderContentBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'list':
        return (
          <ul key={`list-${idx}`} className="space-y-1.5 pl-5 text-sm text-text-secondary">
            {block.items.map((item, listIdx) => (
              <li key={listIdx} className="relative before:absolute before:-left-3 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-surface-400">
                {item}
              </li>
            ))}
          </ul>
        )
      case 'definition':
        return (
          <div key={`definition-${idx}`} className="rounded-lg border border-surface-200 bg-surface-50 p-4">
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
          <p key={`paragraph-${idx}`} className="text-sm leading-relaxed text-text-secondary">
            {block.type === 'paragraph' ? block.text : (block as any)}
          </p>
        )
    }
  }

  return (
    <div className="min-h-screen">
      {/* Dark refund hero */}
      <section className="bg-surface-900 pb-10 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {tBreadcrumb('home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.refund')}</span>
          </div>

          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
              <CreditCard className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{t('hero.title')}</h1>
              <p className="mt-1 max-w-2xl text-sm text-surface-400">{t('hero.subtitle')}</p>
            </div>
          </div>

          {/* Meta + badges */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            {Array.isArray(heroMeta) && heroMeta.length > 0
              ? heroMeta.map((meta) => (
                  <span key={meta.label} className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
                    <Shield className="h-3 w-3 text-brand-400" />
                    <span className="text-surface-500">{meta.label}:</span>
                    <span>{meta.value}</span>
                  </span>
                ))
              : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
              <CreditCard className="h-3 w-3 text-brand-400" />
              {t('hero.badges.payments')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
              <LifeBuoy className="h-3 w-3 text-brand-400" />
              {t('hero.badges.support')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/60 bg-amber-950/30 px-3 py-1.5 text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {t('hero.badges.digitalOnly')}
            </span>
          </div>

          {/* Key points horizontal strip */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCard?.items && Array.isArray(summaryCard.items)
              ? summaryCard.items.slice(0, 4).map((item: string, idx: number) => (
                  <div key={idx} className="rounded-lg border border-surface-700 bg-surface-800/60 p-3">
                    <p className="text-xs leading-relaxed text-surface-400">{item}</p>
                  </div>
                ))
              : null}
          </div>
          {summaryCard?.note && (
            <p className="mt-3 text-xs text-surface-500">{summaryCard.note}</p>
          )}
        </div>
      </section>

      {/* Reminder + digital content warning */}
      <section className="border-b border-surface-200 bg-gold-50 py-3">
        <div className="mx-auto flex max-w-page items-center gap-3 px-4 sm:px-6 lg:px-8">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold-600" />
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gold-700">{toc?.reminder?.label}</span>
            <p className="text-xs text-text-secondary">{toc?.reminder?.text}</p>
          </div>
        </div>
      </section>

      {/* Inline TOC + Content — full-width sections */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Inline compact TOC */}
          <div className="mb-8 rounded-xl border border-surface-200 bg-white p-4 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-semibold text-text-main">{toc?.title}</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
              {toc?.items && Array.isArray(toc.items)
                ? toc.items.map((item, idx: number) => (
                    <a
                      key={item.anchor}
                      href={`#${item.anchor}`}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-text-secondary transition hover:bg-surface-50 hover:text-brand-600"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] font-semibold text-text-muted">
                        {idx + 1}
                      </span>
                      {item.label}
                    </a>
                  ))
                : null}
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-5">
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
      </section>

      {/* Related legal + support links */}
      <section className="border-t border-surface-200 bg-white py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">Related policies</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href="/terms" className="group flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-brand-200">
              <FileText className="h-4 w-4 text-brand-600" />
              <span className="flex-1 text-xs font-medium text-text-main">Terms & Conditions</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted transition group-hover:text-brand-600" />
            </Link>
            <Link href="/privacy" className="group flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-brand-200">
              <Shield className="h-4 w-4 text-brand-600" />
              <span className="flex-1 text-xs font-medium text-text-main">Privacy Policy</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted transition group-hover:text-brand-600" />
            </Link>
            <Link href="/risk-and-disclaimer" className="group flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-brand-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="flex-1 text-xs font-medium text-text-main">Risk Disclosure</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted transition group-hover:text-brand-600" />
            </Link>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="border-t border-surface-200 bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-card md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <h2 className="text-lg font-semibold text-text-main">{t('cta.title')}</h2>
                <p className="mt-1 text-sm text-text-secondary">{t('cta.subtitle')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold">
                {t('cta.contactSupport')}
              </Link>
              <Link href="/" className="btn-secondary rounded-lg px-5 py-2.5 text-sm">
                {t('cta.backHome')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
