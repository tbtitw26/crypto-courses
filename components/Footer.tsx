'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Instagram, Linkedin, Mail, Phone } from 'lucide-react'
import type { ReactNode } from 'react'

const companyLinks = [
  { href: '/about', key: 'about' },
  { href: '/pricing', key: 'pricing' },
  { href: '/faq', key: 'faq' },
  { href: '/contact', key: 'contactUs' },
] as const

const learnLinks = [
  { href: '/courses', key: 'courses' },
  { href: '/learn?tab=custom', key: 'customCourses' },
  { href: '/learn?tab=ai', key: 'aiStrategyBuilder' },
  { href: '/glossary', key: 'glossary' },
  { href: '/resources', key: 'resources' },
] as const

const toolLinks = [
  { href: '/learn/risk-management', key: 'riskManagement' },
  { href: '/learn/trade-journal', key: 'tradeJournal' },
  { href: '/learn/weekly-review', key: 'weeklyReview' },
  { href: '/learn/pre-session', key: 'preSession' },
  { href: '/learn/position-sizing', key: 'positionSizing' },
  { href: '/learn/strategy-snapshot', key: 'strategySnapshot' },
] as const

const legalLinks = [
  { href: '/risk-and-disclaimer', key: 'riskDisclaimer' },
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
  { href: '/cookies', key: 'cookies' },
  { href: '/refund-policy', key: 'refundPolicy' },
] as const

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations('common')
  const tNav = useTranslations('common.nav')
  const tFooter = useTranslations('common.footer')

  return (
    <footer className="relative z-10 border-t border-surface-300 bg-white">
      <div className="mx-auto max-w-page px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center rounded-lg" aria-label={`${t('brand.name')} home`}>
              <span className="relative block h-10 w-[140px]">
                <Image
                  src="/logo.png"
                  alt={t('brand.name')}
                  fill
                  sizes="140px"
                  className="object-contain object-left"
                />
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              {tFooter('educationOnlyLine')} Courses, token top-ups, custom PDFs, and AI strategy documents are provided for education and research workflows.
            </p>

            <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold-600">Risk notice</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                Trading in high-risk markets can result in losses. Avenqor does not provide investment advice, trade signals, brokerage, or account management.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            <FooterColumn title={tFooter('companyTitle')}>
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-text-secondary transition-colors hover:text-brand-800">
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title={tFooter('learnTitle')}>
              {learnLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-text-secondary transition-colors hover:text-brand-800">
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title={tFooter('usefulLinksTitle')}>
              {toolLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-text-secondary transition-colors hover:text-brand-800">
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title={tFooter('legalTitle')}>
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-text-secondary transition-colors hover:text-brand-800">
                    {tFooter(`links.${item.key}`)}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </div>
        </div>

        <div className="mt-12 grid gap-6 border-t border-surface-200 pt-8 lg:grid-cols-3 lg:items-start">
          <div>
            <p className="font-heading text-sm font-bold text-text-main">OVERSEAS SUPPORT LIMITED</p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
              {tFooter('companyNumber')}: 15969862
              <br />
              {tFooter('companyAddress')}
            </p>
          </div>

          <div>
            <p className="font-heading text-sm font-bold text-text-main">{tFooter('getInTouchTitle')}</p>
            <div className="mt-2 grid gap-1.5">
              <a href="mailto:info@avenqor.net" className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:text-brand-900">
                <Mail className="h-4 w-4" />
                info@avenqor.net
              </a>
              <a href="tel:+447457424685" className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:text-brand-900">
                <Phone className="h-4 w-4" />
                +44 7457 424685
              </a>
            </div>
          </div>

          <div>
            <p className="font-heading text-sm font-bold text-text-main">Social</p>
            <div className="mt-2 flex items-center gap-2">
              <a
                href="https://www.instagram.com/avenqorofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-300 text-text-secondary transition-colors hover:border-brand-600/40 hover:bg-brand-50 hover:text-brand-800"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/avenqor/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-300 text-text-secondary transition-colors hover:border-brand-600/40 hover:bg-brand-50 hover:text-brand-800"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-surface-200 bg-surface-100/50">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-[13px] text-text-muted">
            &copy; {currentYear} OVERSEAS SUPPORT LIMITED. {tFooter('allRightsReserved')}.
          </p>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/visa-logo.svg" alt="Visa" width={44} height={28} className="h-7 w-auto opacity-70" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mastercard-logo.svg" alt="MasterCard" width={44} height={28} className="h-7 w-auto opacity-70" />
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-wider text-text-main">{title}</h2>
      <ul className="mt-3 grid gap-2">{children}</ul>
    </div>
  )
}
