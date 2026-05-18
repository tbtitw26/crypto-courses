// components/TopUpPage.tsx - Wallet funding page

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  CreditCard,
  PlusCircle,
  Shield,
  Wallet,
} from 'lucide-react'
import { calculatePriceForTokens, formatPrice, getCurrencySymbol } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

const WORKFLOW_STEPS = [
  { label: 'Choose amount', icon: Coins },
  { label: 'Secure checkout', icon: CreditCard },
  { label: 'Tokens credited', icon: Wallet },
]

export function TopUpPage() {
  const t = useTranslations('topUp')
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
    label: index === 1 ? t('packs.mostPopular') : undefined,
  }))

  const active = packs[selectedPack]

  return (
    <div className="min-h-screen">
      {/* ─── Funding hero ─── */}
      <section className="bg-surface-900">
        <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
              <Wallet className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
                {t('title')}
              </h1>
            </div>
          </div>
          <p className="max-w-lg text-sm text-surface-400">{t('subtitle')}</p>

          {/* Workflow strip */}
          <div className="mt-8 flex items-center gap-1">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                    <step.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden text-sm font-medium text-surface-300 sm:inline">
                    {step.label}
                  </span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="mx-2 h-px w-6 bg-surface-700 sm:w-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pack selector ─── */}
      <section className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-text-main">{t('packs.title')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('packs.subtitle')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Pack rows */}
          <div className="space-y-3">
            {packs.map((pack: any, index: number) => (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(index)}
                className={`group flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
                  selectedPack === index
                    ? 'border-brand-600 bg-brand-50/50 shadow-card'
                    : 'border-surface-300 bg-white hover:border-surface-400'
                }`}
              >
                {/* Radio indicator */}
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selectedPack === index
                      ? 'border-brand-600 bg-brand-600'
                      : 'border-surface-400'
                  }`}
                >
                  {selectedPack === index && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>

                {/* Pack icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                    selectedPack === index
                      ? 'border-gold-200 bg-gold-50'
                      : 'border-surface-200 bg-surface-100'
                  }`}
                >
                  <Coins
                    className={`h-5 w-5 ${
                      selectedPack === index ? 'text-gold-600' : 'text-text-muted'
                    }`}
                  />
                </div>

                {/* Pack details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-main">{pack.name}</p>
                    {pack.label && (
                      <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                        {pack.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-text-secondary">{pack.subtitle}</p>
                </div>

                {/* Price + tokens */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-text-main">{pack.formattedPrice}</p>
                  <p className="text-sm text-text-muted">
                    {pack.tokens.toLocaleString('en-US')} {t('tokens')}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Sticky summary */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-surface-300 bg-white shadow-card">
              <div className="border-b border-surface-200 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Selected pack
                </p>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold-200 bg-gold-50">
                    <Coins className="h-5 w-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main">{active.name}</p>
                    <p className="text-sm text-text-secondary">{active.subtitle}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-lg bg-surface-100 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Price</span>
                    <span className="font-semibold text-text-main">{active.formattedPrice}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Tokens</span>
                    <span className="font-semibold text-text-main">
                      {active.tokens.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <ul className="mt-4 space-y-2">
                  {active.benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-surface-200 px-5 py-4">
                <Link
                  href={`/checkout?pack=${active.id}`}
                  className="btn-primary w-full text-center"
                >
                  {t('buyPack', { name: active.name })}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Custom amount calculator ─── */}
      <section className="bg-surface-100">
        <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl">
            <div className="rounded-xl border border-surface-300 bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c7c9f5] bg-[#eef0ff]">
                  <PlusCircle className="h-5 w-5 text-ai" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-text-main">
                    {t('customTopUp.title')}
                  </h3>
                  <p className="text-sm text-text-secondary">{t('customTopUp.subtitle')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('customTopUp.amountLabel')}
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-text-muted">
                      {getCurrencySymbol(currency)}
                    </span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      inputMode="decimal"
                      placeholder="0.01"
                      className="input-field w-full pl-8 text-sm"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-semibold text-text-muted">
                      {currency}
                    </span>
                  </div>
                </label>

                <p className="text-xs text-text-muted">{t('customTopUp.minAmount')}</p>

                <Link
                  href={`/checkout?custom=${customAmount}&currency=${currency}`}
                  className="btn-primary mt-1 flex w-full items-center justify-center gap-2 text-center"
                >
                  <span>{t('customTopUp.cta')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust / compliance strip ─── */}
      <section className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
          <p className="text-xs leading-relaxed text-text-muted">
            Token purchases are processed securely via hosted payment. All content is for educational
            purposes only. Tokens do not constitute financial advice or tradable instruments.
          </p>
        </div>
      </section>
    </div>
  )
}
