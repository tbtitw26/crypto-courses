// components/TokenPacks.tsx - Token packs component

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Coins, PlusCircle, Check } from 'lucide-react'
import Link from 'next/link'
import { HomeSection } from './HomeSection'
import { calculatePriceForTokens, formatPrice, getCurrencySymbol } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'

export function TokenPacks() {
  const t = useTranslations('home.tokenPacks')
  const [currency, setCurrency] = useState('GBP')
  const [customAmount, setCustomAmount] = useState('0.01')

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

  const packs = (t.raw('packs') as any[]).map((pack: any) => ({
    ...pack,
    price: calculatePriceForTokens(pack.tokens, currency),
    formattedPrice: formatPrice(calculatePriceForTokens(pack.tokens, currency), currency),
  }))

  const customTopUp = t.raw('customTopUp') as any

  return (
    <HomeSection className="pb-14">
      <div className="space-y-8">
        {/* Section heading */}
        <div className="max-w-2xl">
          <h2 className="section-heading font-heading">{t('title')}</h2>
          <p className="section-subheading mt-2">{t('subtitle')}</p>
        </div>

        {/* 4-column grid: 3 packs + 1 custom top-up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {packs.map((pack: any, index: number) => {
            const isPopular = index === 1

            return (
              <motion.div
                key={pack.id}
                className={`
                  glass-panel rounded-2xl p-6 flex flex-col gap-4 relative
                  ${isPopular ? 'gradient-border shadow-brand-glow scale-[1.02]' : ''}
                `}
                whileHover={{ scale: isPopular ? 1.025 : 1.005, y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {/* Most Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-gold">{t('mostPopular')}</span>
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <div className="font-heading text-base font-semibold text-text-main">
                      {pack.name}
                    </div>
                    <div className="text-sm text-text-muted">{pack.subtitle}</div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <div className="font-heading text-2xl font-bold text-text-main">
                    {pack.formattedPrice}
                  </div>
                  <div className="text-sm text-text-muted">
                    {pack.tokens.toLocaleString('en-US')} {t('tokens')} · {pack.description}
                  </div>
                </div>

                {/* Benefits */}
                <ul className="space-y-2 flex-1">
                  {(pack.benefits as string[]).map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Buy button */}
                <div className="mt-auto pt-2">
                  <Link href={`/checkout?pack=${pack.id}`} className="btn-primary w-full">
                    {pack.cta}
                  </Link>
                </div>
              </motion.div>
            )
          })}

          {/* Custom top-up card */}
          <motion.div
            className="glass-panel rounded-2xl p-6 flex flex-col gap-4"
            whileHover={{ scale: 1.005, y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Icon + title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <div className="font-heading text-base font-semibold text-text-main">
                  {customTopUp.title}
                </div>
                <div className="text-sm text-text-muted">{customTopUp.subtitle}</div>
              </div>
            </div>

            {/* Custom amount input */}
            <div className="space-y-2 flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-text-muted text-sm">{getCurrencySymbol(currency)}</span>
                </div>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  inputMode="decimal"
                  placeholder="0.01"
                  className="input-field pl-8"
                />
              </div>
              <p className="text-sm text-text-muted">{customTopUp.minAmount}</p>
            </div>

            {/* Top-up button */}
            <div className="mt-auto pt-2">
              <Link
                href={`/checkout?custom=${customAmount}&currency=${currency}`}
                className="btn-primary w-full"
              >
                {customTopUp.cta}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </HomeSection>
  )
}
