// components/CoursesPageCard.tsx - Course card component for courses listing page

'use client'

import { BookOpen, Gauge } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

interface CoursesPageCardProps {
  course: {
    id: number
    slug: string
    level: string
    market: string
    title: string
    title_ar?: string | null
    description: string
    description_ar?: string | null
    tokens: number
    price_gbp: number
    modules?: number
    duration?: string
    cover_image?: string | null
  }
}

export function CoursesPageCard({ course }: CoursesPageCardProps) {
  const [currency, setCurrency] = useState('GBP')
  const [locale, setLocale] = useState('en')
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const t = useTranslations('courses.course')
  const tCart = useTranslations('cart.messages')
  const tCommon = useTranslations('common.buttons')

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

  const handleAddToCart = () => {
    const imagePath = course.cover_image ?? getCourseImagePath(course.slug)
    addToCart({
      id: course.id,
      slug: course.slug,
      title: course.title,
      title_ar: course.title_ar || undefined,
      tokens: course.tokens,
      price_gbp: course.price_gbp,
      image: imagePath || undefined,
    })
    showToast({
      title: tCart('addedToCart'),
      variant: 'success',
    })
  }

  // Calculate price from tokens: 1.00 GBP = 100 tokens
  const priceAmount = calculatePriceForTokens(course.tokens, currency)
  const price = formatPrice(priceAmount, currency)
  const tokensFormatted = course.tokens.toLocaleString('en-US')
  
  // Estimate modules count (can be enhanced with actual data later)
  const estimatedModules = Math.ceil(course.tokens / 1000) || 7

  // Use localized title and description if available
  const displayTitle = locale === 'ar' && course.title_ar ? course.title_ar : course.title
  const displayDescription =
    locale === 'ar' && course.description_ar ? course.description_ar : course.description

  // Get course image path
  const imagePath = course.cover_image ?? getCourseImagePath(course.slug)
  const hasImage = imagePath !== null

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="flex flex-col bg-slate-950/80 border border-slate-900 rounded-2xl p-4 sm:p-5 gap-3 shadow-[0_18px_40px_rgba(15,23,42,0.75)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
          <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80">
            {course.level}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80">
            {course.market}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80">
            {t('format')}
          </span>
        </div>
        {course.duration && (
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            {course.duration}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        {hasImage ? (
          <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
            <Image
              src={imagePath}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 128px"
              quality={95}
            />
          </div>
        ) : (
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700 flex-shrink-0">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" />
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-sm sm:text-[15px] font-semibold text-slate-50">
            {displayTitle}
          </h2>
          <p className="text-xs text-slate-300/90 leading-relaxed">
            {displayDescription}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <span>
          {estimatedModules} {t('modules')} · {t('format')} {t('download')}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-600" />
        <span>{t('educationOnly')}</span>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-900 flex items-center justify-between gap-3 text-sm">
        <div>
          <div className="font-semibold text-slate-50">{price}</div>
          <div className="text-[11px] text-slate-400">
            ≈ {tokensFormatted} {tCommon('tokens')} · {t('payWithTokens')}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200"
          >
            <span>{t('viewCourse')}</span>
            <span>→</span>
          </Link>
          <button
            onClick={handleAddToCart}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-slate-100 transition"
          >
            <span>{t('addToCart')}</span>
          </button>
        </div>
      </div>
    </motion.article>
  )
}

