// app/checkout/page.tsx - Secure checkout page

'use client'

import { useCart } from '@/contexts/CartContext'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Coins,
  CreditCard,
  Loader2,
  Lock,
  PlusCircle,
  Shield,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { calculatePriceForTokens, formatPrice, calculateTokens } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

function getCartItemType(slug: string): 'token-pack' | 'custom-top-up' | 'course' {
  if (slug.startsWith('token-pack-')) return 'token-pack'
  if (slug.startsWith('custom-top-up')) return 'custom-top-up'
  return 'course'
}

const STEP_LABELS = ['Review order', 'Payment', 'Confirm']

function CheckoutContent() {
  const { items, getCartTotal, clearCart, addToCart } = useCart()
  const { data: session, status: sessionStatus, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const t = useTranslations('cart.checkout')
  const tCommon = useTranslations('common.buttons')
  const tNav = useTranslations('common.nav')
  const tHome = useTranslations('home.tokenPacks')
  const [currency, setCurrency] = useState('GBP')
  const [locale, setLocale] = useState('en')
  const [paymentMethod, setPaymentMethod] = useState<'tokens' | 'card'>('tokens')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [hasProcessedParams, setHasProcessedParams] = useState(false)
  const hasRedirected = useRef(false)

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

  // Redirect unauthenticated users to login with callback
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace(`/login?callbackUrl=${encodeURIComponent('/checkout')}`)
    }
  }, [sessionStatus, router])

  // Process URL parameters (pack or custom top-up)
  useEffect(() => {
    if (hasProcessedParams) return

    const packId = searchParams.get('pack')
    const customAmount = searchParams.get('custom')
    const urlCurrency = searchParams.get('currency') || getUserCurrency()

    if (packId) {
      const packs = tHome.raw('packs') as any[]
      const pack = packs.find((p: any) => p.id === packId)

      if (pack) {
        const packSlug = `token-pack-${packId}`
        const alreadyInCart = items.some(item => item.slug === packSlug)

        if (!alreadyInCart) {
          addToCart({
            id: Date.now(),
            slug: packSlug,
            title: pack.name,
            title_ar: pack.name,
            tokens: pack.tokens,
            price_gbp: calculatePriceForTokens(pack.tokens, 'GBP'),
            image: undefined,
          })
          router.replace('/checkout', { scroll: false })
        }
      }

      setHasProcessedParams(true)
    } else if (customAmount) {
      const amount = parseFloat(customAmount)

      if (!isNaN(amount) && amount > 0) {
        const tokens = calculateTokens(amount, urlCurrency)
        const customSlug = `custom-top-up-${Date.now()}`
        const alreadyInCart = items.some(item => item.slug.startsWith('custom-top-up'))

        if (!alreadyInCart) {
          addToCart({
            id: Date.now(),
            slug: customSlug,
            title: `Custom Top-Up (${formatPrice(amount, urlCurrency)})`,
            title_ar: `شحن مخصص (${formatPrice(amount, urlCurrency)})`,
            tokens: Math.floor(tokens),
            price_gbp: calculatePriceForTokens(Math.floor(tokens), 'GBP'),
            image: undefined,
          })
          router.replace('/checkout', { scroll: false })
        }
      }

      setHasProcessedParams(true)
    } else {
      setHasProcessedParams(true)
    }
  }, [searchParams, addToCart, items, router, tHome, hasProcessedParams])

  const isTokenPurchase = () => {
    return items.some(
      (item) =>
        item.slug.startsWith('token-pack-') || item.slug.startsWith('custom-top-up')
    )
  }

  const user = session?.user as { balance?: number } | undefined
  const userBalance = user?.balance || 0
  const total = getCartTotal(currency)
  const totalPrice = calculatePriceForTokens(total.tokens, currency)
  const formattedPrice = formatPrice(totalPrice, currency)
  const hasEnoughTokens = userBalance >= total.tokens
  const isTokenPurchaseActive = isTokenPurchase()

  // Automatically set payment method to card for token purchases
  useEffect(() => {
    if (isTokenPurchaseActive) {
      setPaymentMethod('card')
    }
  }, [isTokenPurchaseActive])

  // Redirect if cart is empty (but only after processing URL params and not during payment)
  useEffect(() => {
    if (hasProcessedParams && items.length === 0 && !isProcessingPayment && !hasRedirected.current) {
      router.push('/cart')
    }
  }, [items.length, router, isProcessingPayment, hasProcessedParams])

  const handleHostedTopupCheckout = async () => {
    setIsProcessingPayment(true)
    try {
      const totalTokens = items.reduce((sum, item) => sum + item.tokens, 0)

      const response = await fetch('/api/topup/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.slug,
            tokens: item.tokens,
            price_gbp: item.price_gbp,
          })),
          currency: currency,
          totalTokens,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create payment session')
      }

      if (!result.redirectUrl) {
        throw new Error('No redirect URL received from payment gateway')
      }

      window.location.href = result.redirectUrl
    } catch (error: any) {
      showToast({
        title: t('payment.failed'),
        description: error.message || t('payment.failedDescription'),
        variant: 'error',
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleTokenPayment = async () => {
    if (!hasEnoughTokens) {
      showToast({
        title: t('payment.insufficientTokens'),
        variant: 'error',
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      const getLocaleFromCookie = () => {
        if (typeof document === 'undefined') return 'en'
        const cookies = document.cookie.split(';')
        const localeCookie = cookies.find((c) => c.trim().startsWith('user_locale='))
        if (localeCookie) {
          const locale = localeCookie.split('=')[1]?.trim()
          if (locale === 'en' || locale === 'ar') return locale
        }
        return 'en'
      }

      const locale = getLocaleFromCookie()

      for (const item of items) {
        if (item.slug.startsWith('token-pack-') || item.slug.startsWith('custom-top-up')) {
          continue
        }

        const response = await fetch('/api/courses/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseSlug: item.slug,
            language: locale,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to purchase course: ${item.title}`)
        }

        const result = await response.json()
        console.log('[Checkout] Course purchased with tokens:', result)
      }

      await updateSession()

      showToast({
        title: t('payment.success'),
        description: t('payment.successDescription'),
        variant: 'success',
      })

      clearCart()
      hasRedirected.current = true
      router.push('/dashboard')
      router.refresh()
      return
    } catch (error: any) {
      showToast({
        title: t('payment.failed'),
        description: error.message || t('payment.failedDescription'),
        variant: 'error',
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // ─── LOADING / AUTH STATE ───
  if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated' || !hasProcessedParams) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-300 bg-white shadow-card">
          <Loader2 className="h-5 w-5 animate-spin text-brand-700" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-main">Preparing your checkout</p>
          <p className="mt-1 text-sm text-text-muted">Verifying session and order details…</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  // Categorize items
  const courseItems = items.filter((item) => getCartItemType(item.slug) === 'course')
  const tokenItems = items.filter(
    (item) => getCartItemType(item.slug) === 'token-pack' || getCartItemType(item.slug) === 'custom-top-up'
  )

  const checkoutMode = isTokenPurchaseActive
    ? courseItems.length > 0
      ? 'mixed'
      : 'top-up'
    : 'courses'

  const modeLabel = {
    courses: 'Course purchase',
    'top-up': 'Token top-up',
    mixed: 'Mixed order',
  }[checkoutMode]

  const activeStep = paymentMethod === 'card' ? 1 : 0

  return (
    <div className="min-h-screen">
      {/* ─── Command header ─── */}
      <section className="bg-surface-900">
        <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/cart"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-surface-400 transition-colors hover:text-surface-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToCart')}
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-700 bg-surface-800">
                  <Lock className="h-4 w-4 text-brand-400" />
                </div>
                <h1 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
                  {t('title')}
                </h1>
              </div>
              <p className="text-sm text-surface-400">{t('subtitle')}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-200">
                {modeLabel}
              </span>
              <span className="rounded-lg border border-brand-600/30 bg-brand-700/20 px-3 py-1.5 text-xs font-bold text-brand-300">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* ─── Step rail (visual only) ─── */}
          <div className="mt-6 flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      i <= activeStep
                        ? 'bg-brand-500 text-white'
                        : 'border border-surface-600 text-surface-500'
                    }`}
                  >
                    {i < activeStep ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`hidden text-xs font-medium sm:inline ${
                      i <= activeStep ? 'text-surface-200' : 'text-surface-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`mx-1.5 h-px w-6 sm:w-10 ${
                      i < activeStep ? 'bg-brand-500' : 'bg-surface-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Main content ─── */}
      <section className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ─── Left column ─── */}
          <div className="space-y-6">
            {/* ─── Order items ─── */}
            <div className="rounded-xl border border-surface-300 bg-white shadow-card">
              <div className="flex items-center gap-2.5 border-b border-surface-200 px-5 py-4">
                <ShoppingCart className="h-4 w-4 text-text-muted" />
                <h2 className="font-heading text-sm font-semibold text-text-main">
                  Order items ({items.length})
                </h2>
              </div>

              <div className="divide-y divide-surface-200">
                {courseItems.map((item) => (
                  <CheckoutItem key={item.slug} item={item} type="course" locale={locale} currency={currency} tCommon={tCommon} />
                ))}
                {tokenItems.map((item) => (
                  <CheckoutItem
                    key={item.slug}
                    item={item}
                    type={getCartItemType(item.slug)}
                    locale={locale}
                    currency={currency}
                    tCommon={tCommon}
                  />
                ))}
              </div>
            </div>

            {/* ─── Payment method ─── */}
            <div className="rounded-xl border border-surface-300 bg-white shadow-card">
              <div className="flex items-center gap-2.5 border-b border-surface-200 px-5 py-4">
                <CreditCard className="h-4 w-4 text-text-muted" />
                <h2 className="font-heading text-sm font-semibold text-text-main">
                  {t('payment.title')}
                </h2>
              </div>

              <div className="px-5 py-5">
                {isTokenPurchaseActive ? (
                  <>
                    {/* Token purchases: forced card payment */}
                    <div className="rounded-xl border-2 border-brand-600 bg-brand-50/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-100">
                          <CreditCard className="h-5 w-5 text-brand-700" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-main">{t('payment.withCard')}</p>
                          <p className="text-sm text-text-secondary">Pay with {currency}</p>
                        </div>
                        <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-surface-200 bg-surface-100 px-4 py-3">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                      <p className="text-sm leading-relaxed text-text-secondary">
                        {t('payment.tokenPurchaseOnlyCard')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Course purchases: both methods */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => setPaymentMethod('tokens')}
                        className={`group rounded-xl border-2 p-4 text-left transition-all ${
                          paymentMethod === 'tokens'
                            ? 'border-brand-600 bg-brand-50/50'
                            : 'border-surface-300 hover:border-surface-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                              paymentMethod === 'tokens'
                                ? 'border-gold-200 bg-gold-50'
                                : 'border-surface-200 bg-surface-100'
                            }`}
                          >
                            <Coins
                              className={`h-5 w-5 ${
                                paymentMethod === 'tokens' ? 'text-gold-600' : 'text-text-muted'
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-text-main">{t('payment.withTokens')}</p>
                            <p className="mt-0.5 text-sm text-text-secondary">
                              {userBalance.toLocaleString('en-US')} {tCommon('tokens')} available
                            </p>
                          </div>
                          {paymentMethod === 'tokens' && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`group rounded-xl border-2 p-4 text-left transition-all ${
                          paymentMethod === 'card'
                            ? 'border-brand-600 bg-brand-50/50'
                            : 'border-surface-300 hover:border-surface-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                              paymentMethod === 'card'
                                ? 'border-brand-200 bg-brand-100'
                                : 'border-surface-200 bg-surface-100'
                            }`}
                          >
                            <CreditCard
                              className={`h-5 w-5 ${
                                paymentMethod === 'card' ? 'text-brand-700' : 'text-text-muted'
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-text-main">{t('payment.withCard')}</p>
                            <p className="mt-0.5 text-sm text-text-secondary">Pay with {currency}</p>
                          </div>
                          {paymentMethod === 'card' && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Insufficient tokens warning */}
                    {paymentMethod === 'tokens' && !hasEnoughTokens && (
                      <div className="mt-4 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3">
                        <p className="text-sm font-medium text-gold-800">
                          {t('payment.insufficientTokens')}
                        </p>
                        <p className="mt-1 text-sm text-gold-700">
                          You need {total.tokens.toLocaleString('en-US')} tokens but have{' '}
                          {userBalance.toLocaleString('en-US')}.
                        </p>
                        <Link
                          href="/pricing"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
                        >
                          {t('payment.buyTokens')}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ─── Wallet balance strip (courses only) ─── */}
            {!isTokenPurchaseActive && (
              <div className="flex items-center gap-4 rounded-xl border border-surface-300 bg-white px-5 py-4 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold-200 bg-gold-50">
                  <Wallet className="h-5 w-5 text-gold-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Token balance
                  </p>
                  <p className="text-lg font-bold text-text-main">
                    {userBalance.toLocaleString('en-US')}{' '}
                    <span className="text-sm font-normal text-text-secondary">{tCommon('tokens')}</span>
                  </p>
                </div>
                {paymentMethod === 'tokens' && (
                  <div className="text-right">
                    <p className="text-sm text-text-muted">After purchase</p>
                    <p
                      className={`text-sm font-semibold ${
                        hasEnoughTokens ? 'text-brand-700' : 'text-rose-600'
                      }`}
                    >
                      {hasEnoughTokens
                        ? (userBalance - total.tokens).toLocaleString('en-US')
                        : `−${(total.tokens - userBalance).toLocaleString('en-US')} deficit`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Hosted payment details (card selected) ─── */}
            {paymentMethod === 'card' && (
              <div className="rounded-xl border border-surface-300 bg-white shadow-card">
                <div className="flex items-center gap-2.5 border-b border-surface-200 px-5 py-4">
                  <Shield className="h-4 w-4 text-brand-700" />
                  <h3 className="font-heading text-sm font-semibold text-text-main">
                    Secure hosted payment
                  </h3>
                </div>
                <div className="px-5 py-5">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {isTokenPurchaseActive
                      ? 'You’ll be redirected to APS to complete this token purchase securely.'
                      : 'You’ll be redirected to APS to top up the exact token balance needed for this order. After payment, return here to complete your course purchase with tokens.'}
                  </p>

                  <div className="mt-4 space-y-2 rounded-lg bg-surface-100 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Amount</span>
                      <span className="font-semibold text-text-main">{formattedPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{tCommon('tokens')}</span>
                      <span className="font-semibold text-text-main">
                        {total.tokens.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleHostedTopupCheckout}
                    disabled={isProcessingPayment}
                    className="btn-primary mt-5 w-full text-center"
                  >
                    {isProcessingPayment ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('payment.processing')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" />
                        Continue to APS secure checkout
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right column: summary ─── */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-surface-300 bg-white shadow-card">
              <div className="border-b border-surface-200 px-5 py-4">
                <h2 className="font-heading text-base font-semibold text-text-main">
                  {t('orderSummary.title')}
                </h2>
              </div>

              <div className="px-5 py-4">
                {/* Compact item list */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const itemType = getCartItemType(item.slug)
                    const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
                    const itemPrice = calculatePriceForTokens(item.tokens, currency)
                    const formattedItemPrice = formatPrice(itemPrice, currency)

                    return (
                      <div key={item.slug} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                              itemType === 'course'
                                ? 'border-brand-200 bg-brand-50'
                                : itemType === 'token-pack'
                                  ? 'border-gold-200 bg-gold-50'
                                  : 'border-[#c7c9f5] bg-[#eef0ff]'
                            }`}
                          >
                            {itemType === 'course' && <BookOpen className="h-3.5 w-3.5 text-brand-700" />}
                            {itemType === 'token-pack' && <Coins className="h-3.5 w-3.5 text-gold-600" />}
                            {itemType === 'custom-top-up' && <PlusCircle className="h-3.5 w-3.5 text-ai" />}
                          </div>
                          <p className="truncate text-sm font-medium text-text-main">{displayTitle}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-text-main">{formattedItemPrice}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2 border-t border-surface-200 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">{t('orderSummary.subtotal')}</span>
                    <span className="font-medium text-text-main">{formattedPrice}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">{tCommon('tokens')}</span>
                    <span className="font-semibold text-text-main">
                      {total.tokens.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-surface-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-sm font-semibold text-text-main">
                      {t('orderSummary.total')}
                    </span>
                    <span className="font-heading text-xl font-bold text-text-main">{formattedPrice}</span>
                  </div>
                </div>
              </div>

              {/* CTA area */}
              <div className="border-t border-surface-200 px-5 py-4 space-y-3">
                {!isTokenPurchaseActive && paymentMethod === 'tokens' && (
                  <button
                    onClick={handleTokenPayment}
                    disabled={!hasEnoughTokens || isProcessingPayment}
                    className="btn-primary w-full text-center"
                  >
                    {isProcessingPayment ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('payment.processing')}
                      </span>
                    ) : (
                      t('placeOrder')
                    )}
                  </button>
                )}

                {isTokenPurchaseActive && (
                  <p className="text-sm leading-relaxed text-text-muted">
                    After payment, you&apos;ll return to a status page where your token balance updates
                    automatically.
                  </p>
                )}

                {/* Trust signals */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <div className="flex items-center gap-1 text-text-muted">
                    <Lock className="h-3 w-3" />
                    <span className="text-[11px] font-medium">SSL secured</span>
                  </div>
                  <div className="flex items-center gap-1 text-text-muted">
                    <Shield className="h-3 w-3" />
                    <span className="text-[11px] font-medium">PCI compliant</span>
                  </div>
                </div>
              </div>

              {/* Education disclaimer */}
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

// ─── Checkout item row ───

interface CheckoutItemProps {
  item: any
  type: 'course' | 'token-pack' | 'custom-top-up'
  locale: string
  currency: string
  tCommon: any
}

function CheckoutItem({ item, type, locale, currency, tCommon }: CheckoutItemProps) {
  const imagePath = type === 'course' ? item.image ?? getCourseImagePath(item.slug) : null
  const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
  const itemPrice = calculatePriceForTokens(item.tokens, currency)
  const formattedItemPrice = formatPrice(itemPrice, currency)

  const iconConfig = {
    course: { icon: BookOpen, bg: 'border-brand-200 bg-brand-50', color: 'text-brand-700' },
    'token-pack': { icon: Coins, bg: 'border-gold-200 bg-gold-50', color: 'text-gold-600' },
    'custom-top-up': { icon: PlusCircle, bg: 'border-[#c7c9f5] bg-[#eef0ff]', color: 'text-ai' },
  }
  const config = iconConfig[type]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {imagePath ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-surface-200 sm:h-16 sm:w-16">
          <Image
            src={imagePath}
            alt={displayTitle}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 56px, 64px"
          />
        </div>
      ) : (
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border sm:h-16 sm:w-16 ${config.bg}`}
        >
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-main">{displayTitle}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-semibold text-text-main">{formattedItemPrice}</span>
          <span className="text-sm text-text-muted">
            {item.tokens.toLocaleString('en-US')} {tCommon('tokens')}
          </span>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
          type === 'course'
            ? 'bg-brand-50 text-brand-700'
            : type === 'token-pack'
              ? 'bg-gold-50 text-gold-700'
              : 'bg-[#eef0ff] text-ai'
        }`}
      >
        {type === 'course' ? 'Course' : type === 'token-pack' ? 'Pack' : 'Top-up'}
      </span>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-300 bg-white shadow-card">
            <Loader2 className="h-5 w-5 animate-spin text-brand-700" />
          </div>
          <p className="text-sm font-semibold text-text-main">Loading checkout…</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
