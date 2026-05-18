'use client'

import { useEffect, useRef, type ComponentType } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FileText,
  Globe2,
  Info,
  Lock,
  Mail,
  MapPin,
  Settings2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type SectionCard = {
  icon: string
  title: string
  description: string
}

type SectionTable = {
  headers: string[]
  rows: {
    name: string
    purpose: string
    category: string
    lifetime: string
  }[]
}

type SectionBlock = {
  id: string
  number: string
  title: string
  content?: string[]
  list?: string[]
  cards?: SectionCard[]
  table?: SectionTable
  contacts?: string[]
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  shield: ShieldCheck,
  settings: Settings2,
  cpu: Cpu,
  lock: Lock,
  alert: AlertTriangle,
}

export function CookiesPage() {
  const t = useTranslations('cookies')
  const { showToast } = useToast()
  const snapshotCard = t.raw('hero.snapshotCard') as {
    title: string
    subtitle: string
    items: string[]
    note: string
  }
  const hero = t.raw('hero') as any
  const metaPanel = t.raw('metaPanel') as any
  const toc = t.raw('toc') as any
  const sections = t.raw('sections') as SectionBlock[]
  const entryToast = t.raw('entryToast') as { title: string; description: string }
  const toastShownRef = useRef(false)

  const openCookieSettings = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('open-cookie-settings'))
  }

  useEffect(() => {
    if (toastShownRef.current) return
    if (entryToast?.title) {
      showToast({
        title: entryToast.title,
        description: entryToast.description,
        variant: 'info',
        duration: 6500,
      })
      toastShownRef.current = true
    }
  }, [entryToast, showToast])

  const renderSectionCards = (cards: SectionCard[]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card, idx) => {
        const Icon = iconMap[card.icon] ?? ShieldCheck
        return (
          <div key={`${card.title}-${idx}`} className="rounded-lg border border-surface-200 bg-surface-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-semibold text-text-main">{card.title}</span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">{card.description}</p>
          </div>
        )
      })}
    </div>
  )

  const renderSectionTable = (table: SectionTable) => (
    <div className="overflow-x-auto rounded-lg border border-surface-200">
      <table className="min-w-full divide-y divide-surface-200 text-sm">
        <thead className="bg-surface-50">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 bg-white text-text-secondary">
          {table.rows.map((row, idx) => (
            <tr key={`${row.name}-${idx}`} className="transition-colors hover:bg-surface-50">
              <td className="px-4 py-3 font-semibold text-text-main">{row.name}</td>
              <td className="px-4 py-3">{row.purpose}</td>
              <td className="px-4 py-3 text-text-main">{row.category}</td>
              <td className="px-4 py-3">{row.lifetime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Dark cookie hero */}
      <section className="bg-surface-900 pb-10 pt-8">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1 text-xs text-surface-500">
            <Link href="/" className="transition hover:text-surface-300">
              {t('breadcrumb.home')}
            </Link>
            <span>/</span>
            <span className="text-surface-400">{t('breadcrumb.cookies')}</span>
          </div>

          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
              <Settings2 className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <span className="mb-1 inline-block rounded-full border border-surface-700 bg-surface-800 px-2.5 py-0.5 text-xs text-brand-300">
                {hero.pill}
              </span>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{hero.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-surface-400">{hero.subtitle}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
              <Globe2 className="h-3 w-3 text-brand-400" />
              {hero.badges.regions}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-surface-300">
              <FileText className="h-3 w-3 text-brand-400" />
              {hero.badges.features}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/60 bg-amber-950/30 px-3 py-1.5 text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {hero.badges.optional}
            </span>
          </div>

          {/* Highlights + Snapshot in grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Highlights panel */}
            <div className="rounded-xl border border-brand-800/40 bg-brand-950/20 p-4 lg:col-span-3">
              <p className="mb-3 text-sm text-surface-400">{hero.note}</p>
              <ul className="space-y-2">
                {hero.highlights?.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Snapshot card */}
            <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-4 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-400" />
                <div>
                  <p className="text-xs font-semibold text-white">{snapshotCard?.title}</p>
                  <p className="text-xs text-surface-500">{snapshotCard?.subtitle}</p>
                </div>
              </div>
              <ul className="mb-2 space-y-1.5 text-xs text-surface-400">
                {snapshotCard?.items?.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-surface-500">{snapshotCard?.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Manage cookies prominent CTA strip */}
      <section className="border-b border-surface-200 bg-white py-4">
        <div className="mx-auto flex max-w-page flex-col items-start justify-between gap-3 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-medium text-text-main">{t('cta.title')}</span>
            <span className="text-xs text-text-muted">— {t('cta.subtitle')}</span>
          </div>
          <button
            type="button"
            onClick={openCookieSettings}
            className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {t('cta.openCookieSettings')}
          </button>
        </div>
      </section>

      {/* Meta panel + Related pages as cards */}
      <section className="border-b border-surface-200 bg-surface-50 py-6">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Meta details */}
            <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card md:col-span-2">
              <p className="mb-3 text-xs font-semibold text-text-main">{metaPanel.effectiveDate}</p>
              <p className="mb-3 text-xs text-text-muted">{metaPanel.compliance}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {metaPanel.details?.map((detail: any) => (
                  <div key={detail.label}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">{detail.label}</p>
                    <p className="mt-0.5 text-xs text-text-main">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related pages */}
            <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                {toc.relatedPages.label}
              </p>
              <p className="mb-3 text-xs leading-relaxed text-text-muted">
                {toc.relatedPages.text}
              </p>
              <div className="flex flex-col gap-1.5">
                <Link href="/privacy" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700">
                  <ArrowRight className="h-3 w-3" />
                  {toc.relatedPages.privacyLink}
                </Link>
                <Link href="/terms" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700">
                  <ArrowRight className="h-3 w-3" />
                  {toc.relatedPages.termsLink}
                </Link>
                <span className="text-xs text-text-muted">{toc.relatedPages.suffix}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOC + Section content — sidebar layout */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
            {/* TOC sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-surface-200 bg-white p-4 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-semibold text-text-main">{toc.title}</span>
                </div>
                <ul className="space-y-2 text-xs">
                  {toc.items?.map((item: string, idx: number) => (
                    <li key={item} className="text-text-secondary">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Content sections */}
            <div className="space-y-5 lg:col-span-3">
              {sections?.map((section) => (
                <article
                  key={section.id}
                  className="rounded-xl border border-surface-200 bg-white p-5 shadow-card sm:p-6"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-muted">{section.number}.</span>
                    <h2 className="text-sm font-semibold text-text-main">{section.title}</h2>
                  </div>

                  <div className="space-y-3 text-sm">
                    {section.content?.map((paragraph, idx) => (
                      <p key={idx} className="leading-relaxed text-text-secondary">{paragraph}</p>
                    ))}

                    {section.list && (
                      <ul className="space-y-2 text-sm">
                        {section.list.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-text-main">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.cards && renderSectionCards(section.cards)}
                    {section.table && renderSectionTable(section.table)}

                    {section.contacts && (
                      <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
                        <div className="space-y-2 text-sm">
                          {section.contacts.map((contact, idx) => (
                            <div key={contact} className="flex items-start gap-2">
                              {idx === 0 ? (
                                <Mail className="mt-0.5 h-4 w-4 text-brand-600" />
                              ) : (
                                <MapPin className="mt-0.5 h-4 w-4 text-brand-600" />
                              )}
                              <span className="text-text-secondary">{contact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
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
              <button
                type="button"
                onClick={openCookieSettings}
                className="btn-secondary rounded-lg px-5 py-2.5 text-sm"
              >
                {t('cta.openCookieSettings')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
