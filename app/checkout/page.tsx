// app/checkout/page.tsx - Checkout page

'use client'

import { useCart } from '@/contexts/CartContext'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, Coins, PlusCircle, BookOpen } from 'lucide-react'
import { calculatePriceForTokens, formatPrice, calculateTokens } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useState, useEffect, useRef, Suspense } from 'react'
import { HomeSection } from '@/components/HomeSection'
import { useSession } from 'next-auth/react'
import { CardPaymentForm, CardFormData } from '@/components/CardPaymentForm'
import { useToast } from '@/hooks/use-toast'

function CheckoutContent() {
  const { items, getCartTotal, clearCart, addToCart } = useCart()
  const { data: session, update: updateSession } = useSession()
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
  const hasProcessedParams = useRef(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    setCurrency(getUserCurrency())
    // Get locale from cookie
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find((c) => c.trim().startsWith('user_locale='))
    if (localeCookie) {
      const loc = localeCookie.split('=')[1]?.trim()
      if (loc === 'ar' || loc === 'en') {
        setLocale(loc)
      }
    }
  }, [])

  // Process URL parameters (pack or custom top-up)
  useEffect(() => {
    if (hasProcessedParams.current) return
    
    const packId = searchParams.get('pack')
    const customAmount = searchParams.get('custom')
    const urlCurrency = searchParams.get('currency') || getUserCurrency()

    if (packId) {
      // Find pack by id
      const packs = tHome.raw('packs') as any[]
      const pack = packs.find((p: any) => p.id === packId)
      
      if (pack) {
        const packSlug = `token-pack-${packId}`
        
        // Check if pack already in cart
        const alreadyInCart = items.some(item => item.slug === packSlug)
        
        if (!alreadyInCart) {
          addToCart({
            id: Date.now(), // Unique ID
            slug: packSlug,
            title: pack.name,
            title_ar: pack.name, // Can be translated later
            tokens: pack.tokens,
            price_gbp: calculatePriceForTokens(pack.tokens, 'GBP'), // Store in GBP
            image: undefined,
          })
          
          // Clean URL
          router.replace('/checkout', { scroll: false })
        }
      }
      
      hasProcessedParams.current = true
    } else if (customAmount) {
      const amount = parseFloat(customAmount)
      
      if (!isNaN(amount) && amount > 0) {
        const tokens = calculateTokens(amount, urlCurrency)
        const customSlug = `custom-top-up-${Date.now()}`
        
        // Check if custom top-up already in cart
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
          
          // Clean URL
          router.replace('/checkout', { scroll: false })
        }
      }
      
      hasProcessedParams.current = true
    } else {
      // No URL params, mark as processed
      hasProcessedParams.current = true
    }
  }, [searchParams, addToCart, items, router, tHome])

  // Check if cart contains token packs or custom top-up
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
    if (hasProcessedParams.current && items.length === 0 && !isProcessingPayment && !hasRedirected.current) {
      router.push('/cart')
    }
  }, [items.length, router, isProcessingPayment])

  const handleCardPayment = async (cardData: CardFormData) => {
    setIsProcessingPayment(true)
    try {
      // Check if this is a token purchase
      if (isTokenPurchaseActive) {
        // Calculate total tokens from cart items
        const totalTokens = items.reduce((sum, item) => sum + item.tokens, 0)
        
        // Call top-up API
        const response = await fetch('/api/topup', {
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
            totalTokens: totalTokens,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to process top-up')
        }

        const result = await response.json()
        
        // Update session to reflect new balance
        await updateSession()
        
        showToast({
          title: t('payment.success'),
          description: `${totalTokens.toLocaleString('en-US')} tokens added to your account`,
          variant: 'success',
        })
        
        // Clear cart and redirect to dashboard
        clearCart()
        hasRedirected.current = true
        router.push('/dashboard')
        router.refresh()
        return // Exit early after successful payment
      } else {
        // Process course purchases
        // Get user locale from cookie
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

        // Process each course purchase
        for (const item of items) {
          // Skip token packs and custom top-ups (already handled above)
          if (item.slug.startsWith('token-pack-') || item.slug.startsWith('custom-top-up')) {
            continue
          }

          // Call course purchase API
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
          console.log('[Checkout] Course purchased:', result)
        }

        // Update session to reflect new balance
        await updateSession()

        showToast({
          title: t('payment.success'),
          description: t('payment.successDescription'),
          variant: 'success',
        })
        
        clearCart()
        router.push('/dashboard')
        router.refresh()
        return // Exit early after successful payment
      }
    } catch (error: any) {
      showToast({
        title: t('payment.failed'),
        description: error.message || t('payment.failedDescription'),
        variant: 'error',
      })
      throw error
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
      // Get user locale from cookie
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

      // Process each course purchase
      for (const item of items) {
        // Skip token packs and custom top-ups (these should use card payment)
        if (item.slug.startsWith('token-pack-') || item.slug.startsWith('custom-top-up')) {
          continue
        }

        // Call course purchase API
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

      // Update session to reflect new balance
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
      return // Exit early after successful payment
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

  // Show loading state while processing URL params
  if (!hasProcessedParams.current) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  // Redirect if cart is empty after processing params
  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HomeSection>
          <div className="mb-6">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToCart')}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">{t('title')}</h1>
            <p className="text-slate-400">{t('subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Method Selection */}
              <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-slate-50 mb-4">{t('payment.title')}</h2>
                
                {isTokenPurchaseActive ? (
                  // Token purchases: only card payment
                  <>
                    <div className="p-4 rounded-xl border-2 border-cyan-400 bg-cyan-400/10">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-cyan-300" />
                        <div className="text-left">
                          <div className="text-sm font-semibold text-slate-50">{t('payment.withCard')}</div>
                          <div className="text-xs text-slate-400">Pay with {currency}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                      <p className="text-sm text-slate-300">{t('payment.tokenPurchaseOnlyCard')}</p>
                    </div>
                  </>
                ) : (
                  // Regular courses: both payment methods
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('tokens')}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                          paymentMethod === 'tokens'
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Coins className="w-5 h-5 text-cyan-300" />
                        <div className="text-left">
                          <div className="text-sm font-semibold text-slate-50">{t('payment.withTokens')}</div>
                          <div className="text-xs text-slate-400">
                            {userBalance.toLocaleString('en-US')} {tCommon('tokens')} available
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                          paymentMethod === 'card'
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-cyan-300" />
                        <div className="text-left">
                          <div className="text-sm font-semibold text-slate-50">{t('payment.withCard')}</div>
                          <div className="text-xs text-slate-400">Pay with {currency}</div>
                        </div>
                      </button>
                    </div>

                    {paymentMethod === 'tokens' && !hasEnoughTokens && (
                      <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                        <p className="text-sm text-slate-300 mb-2">{t('payment.insufficientTokens')}</p>
                        <Link
                          href="/pricing"
                          className="text-sm text-cyan-300 hover:text-cyan-200 transition"
                        >
                          {t('payment.buyTokens')} →
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <CardPaymentForm
                  total={totalPrice}
                  currency={currency}
                  onSubmit={handleCardPayment}
                  isLoading={isProcessingPayment}
                  userEmail={session?.user?.email}
                />
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5 sticky top-4">
                <h2 className="text-lg font-semibold text-slate-50 mb-4">{t('orderSummary.title')}</h2>
                
                <div className="space-y-3 mb-6">
                  {items.map((item) => {
                    // Helper function to determine cart item type
                    function getCartItemType(slug: string): 'token-pack' | 'custom-top-up' | 'course' {
                      if (slug.startsWith('token-pack-')) return 'token-pack'
                      if (slug.startsWith('custom-top-up')) return 'custom-top-up'
                      return 'course'
                    }

                    const itemType = getCartItemType(item.slug)
                    const imagePath = itemType === 'course' ? item.image ?? getCourseImagePath(item.slug) : null
                    // Use localized title if available and locale is Arabic
                    const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
                    const itemPrice = calculatePriceForTokens(item.tokens, currency)
                    const formattedItemPrice = formatPrice(itemPrice, currency)

                    return (
                      <div key={item.slug} className="flex items-start gap-3 pb-3 border-b border-slate-800">
                        {imagePath ? (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                            <Image
                              src={imagePath}
                              alt={displayTitle}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                            {itemType === 'token-pack' && (
                              <Coins className="w-5 h-5 text-cyan-300" />
                            )}
                            {itemType === 'custom-top-up' && (
                              <PlusCircle className="w-5 h-5 text-cyan-300" />
                            )}
                            {itemType === 'course' && (
                              <BookOpen className="w-5 h-5 text-cyan-300" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-slate-200 line-clamp-2 mb-1">
                            {displayTitle}
                          </h4>
                          <p className="text-[10px] text-slate-400">{formattedItemPrice}</p>
                        </div>
                      </div>
                    )
                  })}
                  
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{t('orderSummary.subtotal')}</span>
                      <span className="font-semibold text-slate-50">{formattedPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{tCommon('tokens')}</span>
                      <span className="font-semibold text-slate-50">
                        {total.tokens.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-slate-200">
                          {t('orderSummary.total')}
                        </span>
                        <span className="text-lg font-bold text-slate-50">{formattedPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show payment button only for regular courses (not token purchases) */}
                {!isTokenPurchaseActive && (
                  <button
                    onClick={handleTokenPayment}
                    disabled={(paymentMethod === 'tokens' && !hasEnoughTokens) || isProcessingPayment}
                    className="w-full px-4 py-3 text-sm font-semibold rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? t('payment.processing') : t('placeOrder')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </HomeSection>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

