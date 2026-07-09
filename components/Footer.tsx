'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  BookOpen,
  ChevronDown,
  Cpu,
  GraduationCap,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const productLinks = [
  { href: '/courses', key: 'courses' },
  { href: '/learn?tab=custom', key: 'customCourses' },
  { href: '/learn?tab=ai', key: 'aiStrategyBuilder' },
  { href: '/pricing', key: 'pricing' },
  { href: '/top-up', label: 'Token Wallet' },
] as const

const learningLinks = [
  { href: '/resources', key: 'resources' },
  { href: '/glossary', key: 'glossary' },
  { href: '/faq', key: 'faq' },
  { href: '/learn/risk-management', key: 'riskManagement' },
  { href: '/learn', key: 'learn' },
] as const

const companyLinks = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contactUs' },
  { href: '/dashboard', key: 'dashboard' },
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
] as const

const policyLinks = [
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
  { href: '/cookies', key: 'cookies' },
  { href: '/refund-policy', key: 'refundPolicy' },
  { href: '/risk-and-disclaimer', key: 'riskDisclaimer' },
] as const

interface LinkGroup {
  titleKey: string
  links: ReadonlyArray<{ href: string; key?: string; label?: string }>
}

const linkGroups: LinkGroup[] = [
  { titleKey: 'products', links: productLinks },
  { titleKey: 'learning', links: learningLinks },
  { titleKey: 'company', links: companyLinks },
]

function FooterLinkGroup({
  title,
  links,
  tNav,
}: {
  title: string
  links: ReadonlyArray<{ href: string; key?: string; label?: string }>
  tNav: (key: string) => string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2 lg:pointer-events-none lg:cursor-default"
        aria-expanded={open}
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-surface-400">
          {title}
        </h2>
        <ChevronDown
          className={`h-4 w-4 text-surface-500 transition-transform lg:hidden ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <nav
        aria-label={title}
        className={`mt-1 space-y-2.5 overflow-hidden transition-all duration-200 lg:mt-3 lg:max-h-none lg:opacity-100 ${
          open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100'
        }`}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block text-sm text-surface-400 transition-colors hover:text-white focus-visible:text-white"
          >
            {link.label ?? tNav(link.key!)}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations('common')
  const tNav = useTranslations('common.nav')
  const tFooter = useTranslations('common.footer')
  const [policiesOpen, setPoliciesOpen] = useState(false)

  return (
    <footer className="relative z-10">
      {/* ═══ LEVEL 1 — CTA Block ═══ */}
      <section className="border-t border-surface-200 bg-surface-950">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-lg">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-400">
                {tFooter('educationOnlyLine')}
              </p>
              <h2 className="font-heading text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                Start building your trading education today
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-surface-400 sm:text-base">
                Browse structured courses by market and level, or create something tailored to your experience.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link href="/courses" className="btn-primary">
                  Browse courses
                </Link>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-300 transition-colors hover:text-white"
                >
                  <Sparkles className="h-4 w-4 text-brand-400" />
                  Build a custom course
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative w-64 rounded-xl border border-surface-700/60 bg-surface-800/40 p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20">
                    <GraduationCap className="h-4 w-4 text-brand-400" />
                  </div>
                  <span className="text-xs font-semibold text-surface-200">Learning Path</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon: BookOpen, label: 'Structured Courses', done: true },
                    { icon: Cpu, label: 'AI Strategy Docs', done: true },
                    { icon: ShieldCheck, label: 'Risk Frameworks', done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${
                          step.done
                            ? 'bg-brand-600/30 text-brand-300'
                            : 'border border-surface-600 text-surface-500'
                        }`}
                      >
                        <step.icon className="h-3 w-3" />
                      </div>
                      <span className={`text-xs ${step.done ? 'text-surface-200' : 'text-surface-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LEVEL 2 — Main Footer Zone ═══ */}
      <div className="border-t border-surface-800 bg-surface-950">
        <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
            {/* Left — Brand zone (~40%) */}
            <div>
              <Link href="/" className="inline-flex items-center rounded-lg" aria-label={`${t('brand.name')} home`}>
                <span className="relative block h-10 w-[140px]">
                  <Image
                    src="/logo-white.png"
                    alt={t('brand.name')}
                    fill
                    sizes="140px"
                    className="object-contain object-left"
                  />
                </span>
              </Link>

              <p className="mt-5 max-w-xs text-sm leading-relaxed text-surface-400">
                {tFooter('educationOnlyLine')} Courses, token top-ups, custom PDFs, and AI strategy documents are provided for education and research workflows.
              </p>

              <address className="mt-6 space-y-2.5 not-italic">
                <a
                  href="mailto:info@cur-nova.com"
                  className="flex items-center gap-2.5 text-sm text-surface-400 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0 text-surface-500" />
                  info@cur-nova.com
                </a>
                <a
                  href="tel:+447457424685"
                  className="flex items-center gap-2.5 text-sm text-surface-400 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0 text-surface-500" />
                  +44 7457 424685
                </a>
              </address>

              <div className="mt-5 border-t border-surface-800 pt-5">
                <p className="text-xs font-semibold text-surface-500">CUR NOVA LTD</p>
                <p className="mt-1 text-xs leading-relaxed text-surface-600">
                  {tFooter('companyNumber')}: 17240836
                  <br />
                  {tFooter('companyAddress')}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://www.instagram.com/curnovaofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-700 text-surface-500 transition-colors hover:border-surface-500 hover:text-white"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/company/cur-nova/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-700 text-surface-500 transition-colors hover:border-surface-500 hover:text-white"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right — Link groups (~60%) */}
            <div className="grid gap-8 sm:grid-cols-3">
              {linkGroups.map((group) => (
                <FooterLinkGroup
                  key={group.titleKey}
                  title={
                    group.titleKey === 'products'
                      ? 'Products'
                      : group.titleKey === 'learning'
                        ? tFooter('learnTitle')
                        : tFooter('companyTitle')
                  }
                  links={group.links}
                  tNav={tNav}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LEVEL 3 — Policies & Legal ═══ */}
      <div className="border-t border-surface-800 bg-surface-900">
        <div className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setPoliciesOpen((v) => !v)}
            className="flex w-full items-center gap-2 lg:pointer-events-none lg:cursor-default"
            aria-expanded={policiesOpen}
          >
            <Scale className="h-3.5 w-3.5 text-surface-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-surface-400">
              {tFooter('legalTitle')}
            </span>
            <ChevronDown
              className={`ml-auto h-4 w-4 text-surface-500 transition-transform lg:hidden ${
                policiesOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <nav
            aria-label="Legal policies"
            className={`mt-3 overflow-hidden transition-all duration-200 lg:max-h-none lg:opacity-100 ${
              policiesOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100'
            }`}
          >
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {policyLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-surface-500 transition-colors hover:text-surface-200 focus-visible:text-surface-200"
                >
                  {tFooter(`links.${link.key}`)}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* ═══ LEVEL 4 — Bottom Legal Bar ═══ */}
      <div className="border-t border-surface-800 bg-surface-950">
        <div className="mx-auto max-w-page px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left — copyright & company */}
            <p className="text-[11px] leading-relaxed text-surface-600">
              &copy; {currentYear} CUR NOVA LTD. {tFooter('allRightsReserved')}.
            </p>

            {/* Center — payment & education badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/visa-logo.svg" alt="Visa" width={36} height={22} className="h-5 w-auto opacity-40" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mastercard-logo.svg" alt="MasterCard" width={36} height={22} className="h-5 w-auto opacity-40" />
              </div>
              <span className="h-3 w-px bg-surface-700" />
              <span className="flex items-center gap-1 text-[11px] text-surface-600">
                <Lock className="h-3 w-3" />
                Secure payment
              </span>
              <span className="h-3 w-px bg-surface-700" />
              <span className="flex items-center gap-1 text-[11px] text-surface-600">
                <ShieldCheck className="h-3 w-3" />
                Education only
              </span>
            </div>

            {/* Right — risk one-liner */}
            <p className="max-w-xs text-[11px] leading-relaxed text-surface-600">
              Trading involves risk.{' '}
              <Link
                href="/risk-and-disclaimer"
                className="text-surface-500 underline underline-offset-2 transition-colors hover:text-surface-300"
              >
                Read full disclaimer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
