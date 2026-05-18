// app/cart/page.tsx - Shopping cart / order review page

'use client'

import { useCart } from '@/contexts/CartContext'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coins,
  PlusCircle,
  ShoppingCart,
  Sparkles,
  X,
} from 'lucide-react'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useState, useEffect } from 'react'

function getCartItemType(slug: string): 'token-pack' | 'custom-top-up' | 'course' {
  if (slug.startsWith('token-pack-')) return 'token-pack'
  if (slug.startsWith('custom-top-up')) return 'custom-top-up'
  return 'course'
}

export default function CartPage() {
  const { items, removeFromCart, getCartTotal } = useCart()
  const t = useTranslations('cart.page')
  const tEmpty = useTranslations('cart.page.empty')
  const tCommon = useTranslations('common.buttons')
  const tNav = useTranslations('common.nav')
  const [currency, setCurrency] = useState('GBP')
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    setCurrency(getUserCurrency())
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find((c) => c.trim().startsWith('user_locale='))
    if (localeCookie) {
      const loc = localeCookie.split('=')[1]?.trim()
      if (loc === 'ar' || loc === 'en') {
        setLocale(loc)
      }
    }
  }, [])

  const total = getCartTotal(currency)
  const totalPrice = calculatePriceForTokens(total.tokens, currency)
  const formattedPrice = formatPrice(totalPrice, currency)

  // Group items by type
  const courseItems = items.filter((item) => getCartItemType(item.slug) === 'course')
  const tokenPackItems = items.filter((item) => getCartItemType(item.slug) === 'token-pack')
  const customTopUpItems = items.filter((item) => getCartItemType(item.slug) === 'custom-top-up')

  // ─── EMPTY STATE ───
  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <section className="bg-surface-900">
          <div className="mx-auto max-w-page px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800">
              <ShoppingCart className="h-6 w-6 text-surface-400" />
            </div>
            <h1 className="mt-5 font-heading text-2xl font-semibold text-white sm:text-3xl">{tEmpty('title')}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-surface-400">{tEmpty('description')}</p>
          </div>
        </section>

        <section className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-text-muted">
            Start here
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                color: 'border-brand-200 bg-brand-50',
                iconColor: 'text-brand-700',
                title: 'Browse courses',
                desc: 'Ready-made structured PDFs for Forex, Crypto, and Binary options at every level.',
                href: '/courses',
                cta: tEmpty('browseCourses'),
              },
              {
                icon: Coins,
                color: 'border-gold-200 bg-gold-50',
                iconColor: 'text-gold-600',
                title: 'Load a token balance',
                desc: 'Buy a token pack and use it across courses, custom PDFs, and AI strategies.',
                href: '/pricing',
                cta: 'View token packs',
              },
              {
                icon: Sparkles,
                color: 'border-[#c7c9f5] bg-[#eef0ff]',
                iconColor: 'text-ai',
                title: 'Custom or AI content',
                desc: 'Request a tailored course PDF or generate an AI trading strategy document.',
                href: '/learn?tab=custom',
                cta: 'Get started',
              },
            ].map((path) => (
              <Link
                key={path.href}
                href={path.href}
                className="group flex flex-col rounded-xl border border-surface-300 bg-white p-6 transition-shadow hover:shadow-card"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${path.color}`}>
                  <path.icon className={`h-5 w-5 ${path.iconColor}`} />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-text-main">{path.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-text-secondary">{path.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
                  {path.cta}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    )
  }

  // ─── CART WITH ITEMS ───
  return (
    <div className="min-h-screen">
      {/* Command header */}
      <section className="bg-surface-900">
        <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/courses"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-surface-400 transition-colors hover:text-surface-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('summary.continueShopping')}
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-white sm:text-3xl">Order review</h1>
              <p className="mt-1 text-sm text-surface-400">{t('subtitle')}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-200">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
              <span className="rounded-lg border border-brand-600/30 bg-brand-700/20 px-3 py-1.5 text-xs font-bold text-brand-300">
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Item groups */}
          <div className="space-y-8">
            {courseItems.length > 0 && (
              <ItemGroup
                label={`Courses (${courseItems.length})`}
                items={courseItems}
                type="course"
                locale={locale}
                currency={currency}
                tCommon={tCommon}
                t={t}
                removeFromCart={removeFromCart}
              />
            )}
            {tokenPackItems.length > 0 && (
              <ItemGroup
                label={`Token packs (${tokenPackItems.length})`}
                items={tokenPackItems}
                type="token-pack"
                locale={locale}
                currency={currency}
                tCommon={tCommon}
                t={t}
                removeFromCart={removeFromCart}
              />
            )}
            {customTopUpItems.length > 0 && (
              <ItemGroup
                label={`Custom top-ups (${customTopUpItems.length})`}
                items={customTopUpItems}
                type="custom-top-up"
                locale={locale}
                currency={currency}
                tCommon={tCommon}
                t={t}
                removeFromCart={removeFromCart}
              />
            )}
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-surface-300 bg-white shadow-card">
              <div className="border-b border-surface-200 px-5 py-4">
                <h2 className="font-heading text-base font-semibold text-text-main">{t('summary.title')}</h2>
              </div>

              <div className="px-5 py-4">
                <dl className="space-y-3 text-sm">
                  {courseItems.length > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-text-secondary">Courses ({courseItems.length})</dt>
                      <dd className="font-medium text-text-main">
                        {formatPrice(
                          calculatePriceForTokens(courseItems.reduce((s, i) => s + i.tokens, 0), currency),
                          currency,
                        )}
                      </dd>
                    </div>
                  )}
                  {tokenPackItems.length > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-text-secondary">Token packs ({tokenPackItems.length})</dt>
                      <dd className="font-medium text-text-main">
                        {formatPrice(
                          calculatePriceForTokens(tokenPackItems.reduce((s, i) => s + i.tokens, 0), currency),
                          currency,
                        )}
                      </dd>
                    </div>
                  )}
                  {customTopUpItems.length > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-text-secondary">Top-ups ({customTopUpItems.length})</dt>
                      <dd className="font-medium text-text-main">
                        {formatPrice(
                          calculatePriceForTokens(customTopUpItems.reduce((s, i) => s + i.tokens, 0), currency),
                          currency,
                        )}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-4 border-t border-surface-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{tCommon('tokens')}</span>
                    <span className="font-semibold text-text-main">{total.tokens.toLocaleString('en-US')}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-surface-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-sm font-semibold text-text-main">{t('summary.total')}</span>
                    <span className="font-heading text-xl font-bold text-text-main">{formattedPrice}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-surface-200 px-5 py-4 space-y-2.5">
                <Link href="/checkout" className="btn-primary w-full text-center">
                  {t('summary.goToCheckout')}
                </Link>
                <Link
                  href="/courses"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-main"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('summary.continueShopping')}
                </Link>
              </div>

              <div className="border-t border-surface-200 px-5 py-3">
                <p className="text-xs leading-relaxed text-text-muted">
                  All content is for educational purposes only. Tokens, courses and AI outputs do not
                  constitute financial advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Item group component ───

interface ItemGroupProps {
  label: string
  items: any[]
  type: 'course' | 'token-pack' | 'custom-top-up'
  locale: string
  currency: string
  tCommon: any
  t: any
  removeFromCart: (slug: string) => void
}

function ItemGroup({ label, items, type, locale, currency, tCommon, t, removeFromCart }: ItemGroupProps) {
  const iconMap = {
    course: { icon: BookOpen, bg: 'border-brand-200 bg-brand-50', color: 'text-brand-700' },
    'token-pack': { icon: Coins, bg: 'border-gold-200 bg-gold-50', color: 'text-gold-600' },
    'custom-top-up': { icon: PlusCircle, bg: 'border-[#c7c9f5] bg-[#eef0ff]', color: 'text-ai' },
  }
  const config = iconMap[type]
  const Icon = config.icon

  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${config.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</h3>
      </div>

      <div className="divide-y divide-surface-200 rounded-xl border border-surface-300 bg-white">
        {items.map((item) => {
          const imagePath = type === 'course' ? item.image ?? getCourseImagePath(item.slug) : null
          const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
          const itemPrice = calculatePriceForTokens(item.tokens, currency)
          const formattedItemPrice = formatPrice(itemPrice, currency)

          return (
            <div key={item.slug} className="flex items-center gap-4 p-4 sm:p-5">
              {/* Thumbnail / icon */}
              {imagePath ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-surface-200 sm:h-20 sm:w-20">
                  <Image
                    src={imagePath}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, 80px"
                  />
                </div>
              ) : (
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border sm:h-20 sm:w-20 ${config.bg}`}>
                  <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${config.color}`} />
                </div>
              )}

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-main sm:text-base">{displayTitle}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-text-main">{formattedItemPrice}</span>
                  <span className="text-sm text-text-muted">
                    {item.tokens.toLocaleString('en-US')} {tCommon('tokens')}
                  </span>
                </div>
                {type === 'course' && (
                  <Link
                    href={`/courses/${item.slug}`}
                    className="mt-1.5 inline-flex text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
                  >
                    {t('item.viewCourse')}
                  </Link>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.slug)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                aria-label={t('item.remove')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
