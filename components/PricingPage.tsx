// components/PricingPage.tsx - Pricing & Tokens page component

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Coins,
  CreditCard,
  Download,
  Repeat,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { calculatePriceForTokens, formatPrice, getCurrencySymbol } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

export function PricingPage() {
  const t = useTranslations('pricing')
  const tHome = useTranslations('home.tokenPacks')
  const [currency, setCurrency] = useState('GBP')
  const [customAmount, setCustomAmount] = useState('0.01')
  const [selectedPack, setSelectedPack] = useState(1)

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  const sanitizeAmount = (value: string): string => {
    let sanitized = String(value).replace(',', '.')
    sanitized = sanitized.replace(/[^\d.]/g, '')
    const parts = sanitized.split('.')
    if (parts.length > 1) {
      sanitized = parts[0] + '.' + parts[1].slice(0, 2)
    }
    return sanitized
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeAmount(e.target.value)
    setCustomAmount(sanitized)
  }

  const packs = (tHome.raw('packs') as any[]).map((pack: any, index: number) => ({
    ...pack,
    price: calculatePriceForTokens(pack.tokens, currency),
    formattedPrice: formatPrice(calculatePriceForTokens(pack.tokens, currency), currency),
    highlighted: index === 1,
    label: index === 1 ? t('tokenPacks.mostPopular') : undefined,
  }))

  const active = packs[selectedPack]

  const steps = [
    t.raw('howTokensWork.steps.step1'),
    t.raw('howTokensWork.steps.step2'),
    t.raw('howTokensWork.steps.step3'),
    t.raw('howTokensWork.steps.step4'),
  ] as any[]

  return (
    <div className="min-h-screen">
      {/* ── DARK COMMAND-CENTER HERO ── */}
      <section className="relative overflow-hidden bg-surface-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.15),transparent)]" />

        <div className="relative mx-auto max-w-page px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
          <nav className="mb-8 flex items-center gap-1.5 text-sm text-surface-500">
            <Link href="/" className="transition-colors hover:text-surface-300">{t('breadcrumb.home')}</Link>
            <span>/</span>
            <span className="font-medium text-surface-300">{t('breadcrumb.pricing')}</span>
          </nav>

          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-surface-400 sm:text-lg">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Wallet workflow strip */}
          <div className="mt-10 rounded-xl border border-surface-700/60 bg-surface-800/50 p-5 backdrop-blur-sm sm:p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-surface-500">Wallet workflow</p>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { icon: Wallet, color: 'bg-brand-700/20 border-brand-600/30', iconColor: 'text-brand-400', title: 'Load tokens', desc: 'Buy a pack or set a custom top-up using your preferred currency.' },
                { icon: Sparkles, color: 'bg-ai/20 border-ai/30', iconColor: 'text-[#8b8ff5]', title: 'Use on content', desc: 'Spend on courses, custom PDFs, and AI-generated strategies.' },
                { icon: Download, color: 'bg-gold-500/20 border-gold-500/30', iconColor: 'text-gold-300', title: 'Download PDFs', desc: 'Access your educational materials from the dashboard library.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.color}`}>
                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-100">{item.title}</p>
                    <p className="text-sm leading-relaxed text-surface-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-surface-700/60 pt-3 text-xs text-surface-500">
              <span className="rounded bg-surface-700 px-1.5 py-px text-[11px] font-bold text-surface-300">{t('hero.exampleRate.badge')}</span>
              <span>
                {t.rich('hero.exampleRate.example', {
                  tokens: () => <span className="font-semibold text-surface-300">{t('hero.exampleRate.tokens')}</span>,
                  price: () => <span className="font-semibold text-surface-300">{t('hero.exampleRate.price')}</span>,
                })}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-8">
            <span className="flex items-center gap-2 text-sm text-surface-300">
              <Coins className="h-4 w-4 text-brand-400" />
              {t('hero.bullets.oneBalance')}
            </span>
            <span className="flex items-center gap-2 text-sm text-surface-300">
              <CreditCard className="h-4 w-4 text-brand-400" />
              {t('hero.bullets.payWithTokens')}
            </span>
            <span className="flex items-center gap-2 text-sm text-surface-300">
              <Repeat className="h-4 w-4 text-brand-400" />
              {t('hero.bullets.topUpAnytime')}
            </span>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE PACK SELECTOR (split layout) ── */}
      <section className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
          {t('tokenPacks.title')}
        </h2>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-text-secondary sm:text-base">
          {t('tokenPacks.subtitle')}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Pack rows */}
          <div className="space-y-2">
            {packs.map((pack, index) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPack(index)}
                className={`group relative w-full rounded-xl border p-4 text-left transition-all sm:p-5 ${
                  selectedPack === index
                    ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-600/20'
                    : 'border-surface-300 bg-white hover:border-surface-400 hover:shadow-sm'
                }`}
              >
                {pack.label && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-brand-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {pack.label}
                  </span>
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selectedPack === index
                        ? 'border-brand-600 bg-brand-600'
                        : 'border-surface-400 bg-white group-hover:border-surface-500'
                    }`}>
                      {selectedPack === index && <span className="block h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-text-main">{pack.name}</p>
                      <p className="text-xs text-text-muted">{pack.subtitle}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-heading text-xl font-bold text-text-main sm:text-2xl">{pack.formattedPrice}</p>
                    <p className="text-xs text-text-muted">{pack.tokens.toLocaleString('en-US')} {tHome('tokens')}</p>
                  </div>
                </div>
              </button>
            ))}
            <div className="flex flex-col items-start gap-0.5 pt-2 text-xs text-text-muted">
              <span>{t('tokenPacks.note')}</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-brand-600" />
                {t('tokenPacks.info')}
              </span>
            </div>
          </div>

          {/* Selected pack summary */}
          <motion.div
            key={active.id}
            className="rounded-xl border border-surface-300 bg-white p-6 shadow-card lg:sticky lg:top-24"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50">
                <Coins className="h-5 w-5 text-brand-700" />
              </div>
              <div>
                <p className="text-lg font-semibold text-text-main">{active.name}</p>
                <p className="text-xs text-text-muted">{active.subtitle}</p>
              </div>
            </div>

            <div className="border-t border-surface-200 pt-4">
              <p className="font-heading text-3xl font-bold text-text-main">{active.formattedPrice}</p>
              <p className="text-sm text-text-muted">{active.tokens.toLocaleString('en-US')} {tHome('tokens')}</p>
            </div>

            <ul className="mt-5 space-y-2.5">
              {active.benefits.map((benefit: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link href={`/checkout?pack=${active.id}`} className="btn-primary mt-6 w-full text-center">
              {t('tokenPacks.buyPack', { name: active.name })}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── CUSTOM TOP-UP CALCULATOR (distinct band) ── */}
      <section className="border-y border-surface-200 bg-surface-100">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
              {t('customTopUp.title')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary sm:text-base">{t('customTopUp.subtitle')}</p>
          </div>

          <div className="mx-auto mt-8 max-w-md">
            <label className="mb-2 block text-xs font-semibold text-text-secondary">
              {t('customTopUp.amountLabel')}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-semibold text-text-muted">
                  {getCurrencySymbol(currency)}
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  inputMode="decimal"
                  placeholder="0.01"
                  className="input-field !py-3.5 !pl-10 !pr-4 text-lg font-semibold"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-4 py-3.5 text-xs font-semibold text-text-secondary">
                <span>GBP</span>
                <span className="text-surface-400">&middot;</span>
                <span>EUR</span>
                <span className="text-surface-400">&middot;</span>
                <span>USD</span>
                <span className="text-surface-400">&middot;</span>
                <span>SR</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-text-muted">{t('customTopUp.minAmount')}</p>
            <Link
              href={`/checkout?custom=${customAmount}&currency=${currency}`}
              className="btn-primary mt-5 w-full text-center"
            >
              {t('customTopUp.buyCta')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── TWO-PATH DECISION MODULE ── */}
      <section className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-xl border border-surface-300 bg-surface-300 gap-px md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col bg-white p-6 sm:p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50">
              <Coins className="h-5 w-5 text-brand-700" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-text-main">Top up token balance</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-text-secondary">
              Load tokens once and use them across all Avenqor products — courses, custom PDFs, and AI-generated strategies. Tokens do not expire.
            </p>
            <Link href="/top-up" className="btn-primary mt-6 w-full text-center">
              {t('cta.choosePack')}
            </Link>
          </div>

          <div className="flex items-center justify-center bg-surface-100 px-4 py-2 md:py-0">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">or</span>
          </div>

          <div className="flex flex-col bg-white p-6 sm:p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-200 bg-surface-100">
              <CreditCard className="h-5 w-5 text-text-muted" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-text-main">{t('directPayment.title')}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-text-secondary">{t('directPayment.subtitle')}</p>
            <Link href="/checkout" className="btn-secondary mt-6 w-full text-center">
              {t('directPayment.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOKEN WORKFLOW VERTICAL TIMELINE ── */}
      <section className="mx-auto max-w-page px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
          {t('howTokensWork.title')}
        </h2>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-text-secondary sm:text-base">
          {t('howTokensWork.subtitle')}
        </p>

        <div className="relative mt-8">
          <div className="absolute bottom-3 left-[15px] top-3 hidden w-px bg-surface-300 sm:block" />
          <div className="space-y-6 sm:space-y-0">
            {steps.map((step, index) => (
              <div key={index} className="relative flex gap-5 sm:gap-6 sm:pb-8 last:sm:pb-0">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 bg-white text-xs font-bold text-brand-700">
                  {index + 1}
                </div>
                <div className="pb-1 pt-0.5">
                  <p className="text-sm font-semibold text-text-main">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RISK / COMPLIANCE BAR ── */}
      <section className="border-y border-gold-200 bg-gold-50/40">
        <div className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:flex lg:items-start lg:gap-6 lg:px-8">
          <div className="mb-3 flex shrink-0 items-center gap-2 lg:mb-0">
            <AlertTriangle className="h-4 w-4 text-gold-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-gold-700">{t('riskNotice.title')}</span>
          </div>
          <div className="flex-1 space-y-1.5 text-sm leading-relaxed text-text-secondary">
            <p>{t('riskNotice.paragraph1')}</p>
            <p>{t('riskNotice.paragraph2')}</p>
          </div>
          <Link
            href="/risk-and-disclaimer"
            className="mt-3 inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 lg:mt-0"
          >
            {t('riskNotice.cta')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── DARK CTA BOOKEND ── */}
      <section className="bg-surface-900">
        <div className="mx-auto max-w-page px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-16">
          <h2 className="font-heading text-2xl font-semibold text-white sm:text-3xl">{t('cta.title')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base text-surface-400">{t('cta.subtitle')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/top-up" className="btn-primary">{t('cta.choosePack')}</Link>
            <Link
              href="/top-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-600 bg-surface-800 px-6 py-3 font-heading text-sm font-semibold text-surface-200 transition-all duration-200 hover:bg-surface-700 hover:text-white"
            >
              {t('cta.setTopUp')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
