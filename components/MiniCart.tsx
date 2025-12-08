// components/MiniCart.tsx - Mini cart dropdown component

'use client'

import { useCart } from '@/contexts/CartContext'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingCart, Coins, PlusCircle, BookOpen } from 'lucide-react'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useState, useEffect } from 'react'

interface MiniCartProps {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function MiniCart({ onMouseEnter, onMouseLeave }: MiniCartProps = {}) {
  const { items, removeFromCart, getCartTotal } = useCart()
  const t = useTranslations('cart.miniCart')
  const tEmpty = useTranslations('cart.empty')
  const tCommon = useTranslations('common.buttons')
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
      <div
        className="w-80 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 p-6"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex flex-col items-center justify-center text-center py-8">
          <ShoppingCart className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-200 mb-1">{tEmpty('title')}</h3>
          <p className="text-xs text-slate-400">{tEmpty('description')}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-80 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-50">{t('title')}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => {
          const itemType = getCartItemType(item.slug)
          const imagePath = itemType === 'course' ? item.image ?? getCourseImagePath(item.slug) : null
          // Use localized title if available and locale is Arabic
          const displayTitle = locale === 'ar' && item.title_ar ? item.title_ar : item.title
          
          return (
            <div key={item.slug} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
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
                <div className="h-12 w-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
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
                <p className="text-[10px] text-slate-400">
                  {item.tokens.toLocaleString('en-US')} {tCommon('tokens')}
                </p>
              </div>
              
              <button
                onClick={() => removeFromCart(item.slug)}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                aria-label={t('remove')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{tCommon('tokens')}:</span>
          <span className="font-semibold text-slate-50">{total.tokens.toLocaleString('en-US')}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total:</span>
          <span className="font-semibold text-slate-50">{formattedPrice}</span>
        </div>
        
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition"
          >
            {t('goToCheckout')}
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 text-slate-200 hover:border-slate-500 transition"
          >
            {t('goToCart')}
          </Link>
        </div>
      </div>
    </div>
  )
}

