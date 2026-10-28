'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { withContactPhone } from '@/lib/contact'
import { Info, FileText, Shield, Lock, CalendarDays, CreditCard, ChevronDown, ChevronRight } from 'lucide-react'

// Policy text lives in i18n/{locale}/privacy.json. Section and clause numbers are part of
// the data (clause numbers are inside the paragraph text), so nothing here auto-numbers.

type EffectiveDate = { label: string; value: string }

type KeyPoints = { title: string; items: string[]; note?: string }

type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'address'; lines: string[] }
  | { type: 'subheading'; id: string; number: string; title: string }

type PolicySection = {
  id: string
  number: string
  title: string
  content: ContentBlock[]
}

const LINK_PATTERN = /(https?:\/\/[^\s]*[^\s.,;:)]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
const linkClass = 'text-brand-600 underline-offset-2 hover:underline'

// Turns e-mail addresses and URLs inside policy text into working links.
function linkify(text: string): ReactNode[] {
  return text.split(LINK_PATTERN).map((part, idx) => {
    if (idx % 2 === 0) return part
    if (!part.startsWith('http')) {
      return (
        <a key={idx} href={`mailto:${part}`} className={linkClass}>
          {part}
        </a>
      )
    }
    const external = !part.startsWith('https://www.cur-nova.com')
    return (
      <a
        key={idx}
        href={part}
        className={`${linkClass} break-all`}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {part}
      </a>
    )
  })
}

function renderContentBlock(block: ContentBlock, idx: number) {
  switch (block.type) {
    case 'subheading':
      return (
        <h3 key={`h-${idx}`} id={block.id} className="scroll-mt-24 pt-1 text-sm font-semibold text-text-main">
          <span className="mr-1.5 text-text-muted">{block.number}</span>
          {block.title}
        </h3>
      )
    case 'list':
      return (
        <ul key={`list-${idx}`} className="space-y-1.5 pl-5 text-sm text-text-secondary">
          {block.items.map((item, itemIdx) => (
            <li key={itemIdx} className="relative before:absolute before:-left-3 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-surface-400">
              {linkify(item)}
            </li>
          ))}
        </ul>
      )
    case 'quote':
      return (
        <blockquote key={`q-${idx}`} className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm italic leading-relaxed text-text-secondary">
          {linkify(block.text)}
        </blockquote>
      )
    case 'address':
      return (
        <address key={`addr-${idx}`} className="rounded-lg border border-surface-200 bg-surface-50 p-4 text-sm not-italic leading-relaxed text-text-secondary">
          {withContactPhone(block.lines).map((line, lineIdx) => (
            <span key={lineIdx} className="block">
              {linkify(line)}
            </span>
          ))}
        </address>
      )
    case 'paragraph':
    default:
      return (
        <p key={`p-${idx}`} className="text-sm leading-relaxed text-text-secondary">
          {linkify(block.text)}
        </p>
      )
  }
}

export function PrivacyPage() {
  const t = useTranslations('privacy')
  const tUi = useTranslations('common.ui')
  const tRefund = useTranslations('refund')
  const tBreadcrumb = useTranslations('courses.breadcrumb')

  const effectiveDate = t.raw('hero.effectiveDate') as EffectiveDate
  const intro = t.raw('hero.intro') as string[]
  const keyPoints = t.raw('keyPoints') as KeyPoints
  const sections = t.raw('sections') as PolicySection[]

  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const tocList = (
    <ul className="space-y-2 text-xs">
      {sections.map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`} className="flex items-start gap-1.5 text-text-secondary transition hover:text-brand-600">
            <span className="text-text-muted">{section.number}</span>
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  )

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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-text-secondary">
                <CalendarDays className="h-3 w-3 text-brand-600" />
                <span className="text-text-muted">{effectiveDate.label}:</span>
                <span>{effectiveDate.value}</span>
              </span>
              {intro.map((paragraph, idx) => (
                <p key={idx} className="max-w-xl text-sm leading-relaxed text-text-secondary">
                  {linkify(paragraph)}
                </p>
              ))}
            </div>

            {/* Key points side panel */}
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-600" />
                <h2 className="text-xs font-semibold text-text-main">{keyPoints.title}</h2>
              </div>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {keyPoints.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    <span>{linkify(item)}</span>
                  </li>
                ))}
              </ul>
              {keyPoints.note && <p className="mt-3 text-xs text-text-muted">{keyPoints.note}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar TOC + Content — two-column document layout */}
      <section className="bg-surface-50 py-10">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
            {/* Sidebar TOC */}
            <nav aria-label={t('toc.title')} className="lg:col-span-1">
              {/* Mobile TOC toggle */}
              <button
                type="button"
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                aria-expanded={mobileTocOpen}
                className="flex w-full items-center justify-between rounded-xl border border-surface-200 bg-white p-4 shadow-card lg:hidden"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-semibold text-text-main">{t('toc.title')}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${mobileTocOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileTocOpen && (
                <div className="mt-2 rounded-xl border border-surface-200 bg-white p-4 shadow-card lg:hidden">{tocList}</div>
              )}

              {/* Desktop sticky TOC */}
              <div className="sticky top-24 hidden lg:block">
                <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-600" />
                    <span className="text-xs font-semibold text-text-main">{t('toc.title')}</span>
                  </div>
                  {tocList}
                </div>
              </div>
            </nav>

            {/* Content sections */}
            <div className="space-y-5 lg:col-span-3">
              {sections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-xl border border-surface-200 bg-white p-5 shadow-card sm:p-6"
                >
                  <h2 className="mb-4 text-sm font-semibold text-text-main">
                    <span className="mr-2 text-xs text-text-muted">{section.number}</span>
                    {section.title}
                  </h2>
                  <div className="space-y-3">{section.content.map(renderContentBlock)}</div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related legal links */}
      <section className="border-t border-surface-200 bg-white py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">{tUi('relatedPolicies')}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href="/terms" className="group flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-brand-200">
              <FileText className="h-4 w-4 text-brand-600" />
              <span className="flex-1 text-xs font-medium text-text-main">{tUi('terms')}</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted transition group-hover:text-brand-600" />
            </Link>
            <Link href="/refund-policy" className="group flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-brand-200">
              <CreditCard className="h-4 w-4 text-brand-600" />
              <span className="flex-1 text-xs font-medium text-text-main">{tRefund('breadcrumb.refund')}</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted transition group-hover:text-brand-600" />
            </Link>
            <Link href="/cookies" className="group flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 transition hover:border-brand-200">
              <Shield className="h-4 w-4 text-brand-600" />
              <span className="flex-1 text-xs font-medium text-text-main">{tUi('cookiePolicy')}</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted transition group-hover:text-brand-600" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
