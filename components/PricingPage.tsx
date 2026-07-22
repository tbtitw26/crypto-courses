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
  Loader2,
  Repeat,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { calculatePriceForTokens, formatPrice, getCurrencySymbol } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { useTopupCheckout } from '@/hooks/use-topup-checkout'

export function PricingPage() {
  const t = useTranslations('pricing')
  const tHome = useTranslations('home.tokenPacks')
  const [currency, setCurrency] = useState('GBP')
  const [customAmount, setCustomAmount] = useState('0.01')
  const [selectedPack, setSelectedPack] = useState(1)
  const { startTopup, pendingKey, isPending } = useTopupCheckout('/pricing')

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
      {/* ── LIGHT HERO WITH BRAND BAND ── */}
      <section className="relative overflow-hidden bg-white">
        {/* Top gradient brand band */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700" />

        <div className="relative mx-auto max-w-page px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
          <nav className="mb-8 flex items-center gap-1.5 text-sm text-text-muted">
            <Link href="/" className="transition-colors hover:text-text-main">{t('breadcrumb.home')}</Link>
            <span>/</span>
            <span className="font-medium text-text-main">{t('breadcrumb.pricing')}</span>
          </nav>

          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-main sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Wallet workflow strip */}
          <div className="mt-10 rounded-xl border border-surface-200 bg-surface-50 p-5 sm:p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">Wallet workflow</p>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { icon: Wallet, color: 'bg-brand-50 border-brand-200', iconColor: 'text-brand-600', title: 'Load tokens', desc: 'Buy a pack or set a custom top-up using your preferred currency.' },
                { icon: Sparkles, color: 'bg-purple-50 border-purple-200', iconColor: 'text-purple-600', title: 'Use on content', desc: 'Spend on courses, custom PDFs, and AI-generated strategies.' },
                { icon: Download, color: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600', title: 'Download PDFs', desc: 'Access your educational materials from the dashboard library.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.color}`}>
                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main">{item.title}</p>
                    <p className="text-sm leading-relaxed text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-surface-200 pt-3 text-xs text-text-muted">
              <span className="rounded bg-brand-100 px-1.5 py-px text-[11px] font-bold text-brand-700">{t('hero.exampleRate.badge')}</span>
              <span>
                {t.rich('hero.exampleRate.example', {
                  tokens: () => <span className="font-semibold text-text-main">{t('hero.exampleRate.tokens')}</span>,
                  price: () => <span className="font-semibold text-text-main">{t('hero.exampleRate.price')}</span>,
                })}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-8">
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              <Coins className="h-4 w-4 text-brand-600" />
              {t('hero.bullets.oneBalance')}
            </span>
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              <CreditCard className="h-4 w-4 text-brand-600" />
              {t('hero.bullets.payWithTokens')}
            </span>
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              <Repeat className="h-4 w-4 text-brand-600" />
              {t('hero.bullets.topUpAnytime')}
            </span>
          </div>
        </div>
      </section>

      {/* ── HORIZONTAL PACK CARDS ── */}
      <section className="border-t border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
            {t('tokenPacks.title')}
          </h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-text-secondary sm:text-base">
            {t('tokenPacks.subtitle')}
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {packs.map((pack, index) => (
              <motion.div
                key={pack.id}
                onClick={() => setSelectedPack(index)}
                className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-6 text-left transition-all ${
                  selectedPack === index
                    ? 'border-brand-600 bg-white shadow-lg ring-1 ring-brand-600/20'
                    : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-md'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {pack.label && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-700 px-3 py-0.5 text-[11px] font-bold text-white whitespace-nowrap">
                    {pack.label}
                  </span>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50">
                    <Coins className="h-5 w-5 text-brand-700" />
                  </div>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                    selectedPack === index
                      ? 'border-brand-600 bg-brand-600'
                      : 'border-surface-300 bg-white'
                  }`}>
                    {selectedPack === index && <span className="block h-2 w-2 rounded-full bg-white" />}
                  </span>
                </div>

                <p className="text-lg font-semibold text-text-main">{pack.name}</p>
                <p className="text-xs text-text-muted">{pack.subtitle}</p>

                <p className="mt-4 font-heading text-3xl font-bold text-text-main">{pack.formattedPrice}</p>
                <p className="text-sm text-text-muted">{pack.tokens.toLocaleString('en-US')} {tHome('tokens')}</p>

                <ul className="mt-4 flex-1 space-y-2">
                  {pack.benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPack(index)
                    startTopup({ tokens: pack.tokens, currency, slug: `token-pack-${pack.id}` }, pack.id)
                  }}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-heading text-sm font-semibold transition-all duration-200 disabled:opacity-60 ${
                    selectedPack === index
                      ? 'bg-brand-700 text-white hover:bg-brand-800'
                      : 'border border-surface-300 bg-white text-text-main hover:border-surface-400 hover:bg-surface-50'
                  }`}
                >
                  {pendingKey === pack.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('tokenPacks.buyPack', { name: pack.name })}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-start gap-0.5 text-xs text-text-muted">
            <span>{t('tokenPacks.note')}</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-brand-600" />
              {t('tokenPacks.info')}
            </span>
          </div>
        </div>
      </section>

      {/* ── CUSTOM TOP-UP CALCULATOR (card container) ── */}
      <section className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-surface-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
              {t('customTopUp.title')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary sm:text-base">{t('customTopUp.subtitle')}</p>
          </div>

          <div className="mt-8">
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
              <div className="flex items-center gap-1.5 rounded-xl border border-surface-300 bg-surface-50 px-4 py-3.5 text-xs font-semibold text-text-secondary">
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
            <button
              type="button"
              disabled={isPending || !(parseFloat(customAmount) > 0)}
              onClick={() =>
                startTopup({ amount: parseFloat(customAmount), currency }, 'custom')
              }
              className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 text-center disabled:opacity-60"
            >
              {pendingKey === 'custom' && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('customTopUp.buyCta')}
            </button>
          </div>
        </div>
      </section>

      {/* ── TWO-PATH DECISION: side-by-side weighted cards ── */}
      <section className="mx-auto max-w-page px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Primary path */}
          <div className="flex flex-col rounded-2xl border-2 border-brand-600 bg-brand-50/30 p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold text-text-main">Top up token balance</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
              Load tokens once and use them across all Cur Nova products — courses, custom PDFs, and AI-generated strategies. Tokens do not expire.
            </p>
            <Link href="/top-up" className="btn-primary mt-6 w-full text-center">
              {t('cta.choosePack')}
            </Link>
          </div>

          {/* Secondary path */}
          <div className="flex flex-col rounded-2xl border border-surface-200 bg-white p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100">
              <CreditCard className="h-6 w-6 text-text-muted" />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold text-text-main">{t('directPayment.title')}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{t('directPayment.subtitle')}</p>
            <Link href="/courses" className="btn-secondary mt-6 w-full text-center">
              {t('directPayment.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── HORIZONTAL STEPS STRIP ── */}
      <section className="border-t border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">
            {t('howTokensWork.title')}
          </h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-text-secondary sm:text-base">
            {t('howTokensWork.subtitle')}
          </p>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-surface-200 bg-surface-200 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col bg-white p-6">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-text-main">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{step.description}</p>
                {index < steps.length - 1 && (
                  <ChevronRight className="absolute right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-surface-400 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPACT RISK / COMPLIANCE BAR ── */}
      <section className="border-y border-gold-200 bg-gold-50/40">
        <div className="mx-auto flex max-w-page items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold-600" />
          <p className="flex-1 text-sm leading-relaxed text-text-secondary">
            <span className="font-bold text-gold-700">{t('riskNotice.title')}: </span>
            {t('riskNotice.paragraph1')}
          </p>
          <Link
            href="/risk-and-disclaimer"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700"
          >
            {t('riskNotice.cta')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── ASYMMETRIC CTA ── */}
      <section className="bg-surface-50">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-16">
          <div className="max-w-lg">
            <h2 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">{t('cta.title')}</h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">{t('cta.subtitle')}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <Link href="/top-up" className="btn-primary">{t('cta.choosePack')}</Link>
            <Link
              href="/top-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white px-6 py-3 font-heading text-sm font-semibold text-text-main transition-all duration-200 hover:border-surface-400 hover:bg-surface-50"
            >
              {t('cta.setTopUp')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
