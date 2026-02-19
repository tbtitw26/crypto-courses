// components/Footer.tsx - Main footer component

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations('common')
  const tNav = useTranslations('common.nav')
  const tFooter = useTranslations('common.footer')

  return (
    <footer className="relative z-10 bg-slate-950/95 border-t border-slate-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Column 1: Company Info */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center text-lg font-semibold tracking-wide text-slate-50 hover:text-cyan-300 transition"
            >
              {t('brand.name')}
            </Link>
            <p className="mt-2 text-xs text-slate-400">
              {tFooter('educationOnlyLine')}
            </p>
            <ul className="mt-4 space-y-1.5">
              <li className="text-sm font-semibold text-slate-200">OVERSEAS SUPPORT LIMITED</li>
              <li>
                <span className="text-sm text-slate-400">{tFooter('companyNumber')}: 15969862</span>
              </li>
              <li>
                <span className="text-sm text-slate-400">
                  {tFooter('companyAddress')}
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              {tFooter('companyTitle')}
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('contactUs')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('about')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('pricing')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Learn */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              {tFooter('learnTitle')}
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/courses" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('courses')}
                </Link>
              </li>
              <li>
                <Link href="/learn?tab=custom" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('customCourses')}
                </Link>
              </li>
              <li>
                <Link href="/learn?tab=ai" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('aiStrategyBuilder')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Useful Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              {tFooter('usefulLinksTitle')}
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/glossary" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('glossary')}
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('resources')}
                </Link>
              </li>
              <li>
                <Link href="/learn/risk-management" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('riskManagement')}
                </Link>
              </li>
              <li>
                <Link href="/learn/trade-journal" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('tradeJournal')}
                </Link>
              </li>
              <li>
                <Link href="/learn/weekly-review" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('weeklyReview')}
                </Link>
              </li>
              <li>
                <Link href="/learn/pre-session" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('preSession')}
                </Link>
              </li>
              <li>
                <Link href="/learn/position-sizing" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('positionSizing')}
                </Link>
              </li>
              <li>
                <Link href="/learn/strategy-snapshot" className="text-sm text-slate-400 hover:text-cyan-300 transition">
                  {tNav('strategySnapshot')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">{tFooter('legalTitle')}</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/risk-and-disclaimer"
                  className="text-sm text-slate-400 hover:text-cyan-300 transition"
                >
                  {tFooter('links.riskDisclaimer')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-slate-400 hover:text-cyan-300 transition"
                >
                  {tFooter('links.terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-slate-400 hover:text-cyan-300 transition"
                >
                  {tFooter('links.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-slate-400 hover:text-cyan-300 transition"
                >
                  {tFooter('links.cookies')}
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-sm text-slate-400 hover:text-cyan-300 transition"
                >
                  {tFooter('links.refundPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 6: Get in Touch */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              {tFooter('getInTouchTitle')}
            </h4>
            <p className="mt-4 text-sm text-slate-400">
              {tFooter('haveQuestions')}
            </p>
            <a
              href="mailto:info@avenqor.net"
              className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 hover:underline block mt-2"
            >
              info@avenqor.net
            </a>
            <a
              href="tel:+447457424685"
              className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 hover:underline block mt-2"
            >
              +44 7457 424685
            </a>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.instagram.com/avenqor.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-cyan-300 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/avenqor/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-cyan-300 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {currentYear} OVERSEAS SUPPORT LIMITED. {tFooter('allRightsReserved')}.
          </p>
          <div className="flex items-center gap-4">
            <Image
              src="/visa-logo.svg"
              alt="Visa"
              width={40}
              height={25}
              className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
            <Image
              src="/mastercard-logo.svg"
              alt="MasterCard"
              width={40}
              height={25}
              className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

