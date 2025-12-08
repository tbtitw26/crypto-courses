// app/cart/page.tsx - Shopping cart page

'use client'

import { useCart } from '@/contexts/CartContext'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingCart, ArrowLeft, Coins, PlusCircle, BookOpen } from 'lucide-react'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useState, useEffect } from 'react'
import { HomeSection } from '@/components/HomeSection'

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

  const total = getCartTotal(currency)
  const totalPrice = calculatePriceForTokens(total.tokens, currency)
  const formattedPrice = formatPrice(totalPrice, currency)

  // Helper function to determine cart item type
  function getCartItemType(slug: string): 'token-pack' | 'custom-top-up' | 'course' {
    if (slug.startsWith('token-pack-')) return 'token-pack'
    if (slug.startsWith('custom-top-up')) return 'custom-top-up'
    return 'course'
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <HomeSection>
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h1 className="text-2xl font-semibold text-slate-50 mb-2">{tEmpty('title')}</h1>
              <p className="text-slate-400 mb-6">{tEmpty('description')}</p>
              <Link
                href="/courses"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition"
              >
                {tEmpty('browseCourses')}
              </Link>
            </div>
          </HomeSection>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HomeSection>
          <div className="mb-6">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {tNav('courses')}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">{t('title')}</h1>
            <p className="text-slate-400">{t('subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemType = getCartItemType(item.slug)
                const imagePath = itemType === 'course' ? item.image ?? getCourseImagePath(item.slug) : null
                // Use localized title if available and locale is Arabic
                const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
                const itemPrice = calculatePriceForTokens(item.tokens, currency)
                const formattedItemPrice = formatPrice(itemPrice, currency)

                return (
                  <div
                    key={item.slug}
                    className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-4">
                      {imagePath ? (
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
                          <Image
                            src={imagePath}
                            alt={displayTitle}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 80px, 96px"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                          {itemType === 'token-pack' && (
                            <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" />
                          )}
                          {itemType === 'custom-top-up' && (
                            <PlusCircle className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" />
                          )}
                          {itemType === 'course' && (
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-50 mb-2">
                          {displayTitle}
                        </h3>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-200">{formattedItemPrice}</div>
                            <div className="text-xs text-slate-400">
                              {item.tokens.toLocaleString('en-US')} {tCommon('tokens')}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {itemType === 'course' && (
                              <Link
                                href={`/courses/${item.slug}`}
                                className="text-xs text-cyan-300 hover:text-cyan-200 transition"
                              >
                                {t('item.viewCourse')}
                              </Link>
                            )}
                            <button
                              onClick={() => removeFromCart(item.slug)}
                              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                              aria-label={t('item.remove')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5 sticky top-4">
                <h2 className="text-lg font-semibold text-slate-50 mb-4">{t('summary.title')}</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{t('summary.subtotal')}</span>
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
                      <span className="text-base font-semibold text-slate-200">{t('summary.total')}</span>
                      <span className="text-lg font-bold text-slate-50">{formattedPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    className="block w-full text-center px-4 py-3 text-sm font-semibold rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition"
                  >
                    {t('summary.goToCheckout')}
                  </Link>
                  <Link
                    href="/courses"
                    className="block w-full text-center px-4 py-3 text-sm font-medium rounded-lg border border-slate-700 text-slate-200 hover:border-slate-500 transition"
                  >
                    {t('summary.continueShopping')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </HomeSection>
      </main>
    </div>
  )
}

