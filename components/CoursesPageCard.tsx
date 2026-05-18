// components/CoursesPageCard.tsx - Course card component for courses listing page

'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Gauge, Layers, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'

interface CoursesPageCardProps {
  priority?: boolean
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

export function CoursesPageCard({ course, priority = false }: CoursesPageCardProps) {
  const [currency, setCurrency] = useState('GBP')
  const [locale, setLocale] = useState('en')
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const t = useTranslations('courses.course')
  const tCart = useTranslations('cart.messages')
  const tCommon = useTranslations('common.buttons')

  useEffect(() => {
    setCurrency(getUserCurrency())
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find((cookie) => cookie.trim().startsWith('user_locale='))
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

  const priceAmount = calculatePriceForTokens(course.tokens, currency)
  const price = formatPrice(priceAmount, currency)
  const tokensFormatted = course.tokens.toLocaleString('en-US')
  const estimatedModules = course.modules ?? (Math.ceil(course.tokens / 1000) || 7)
  const displayTitle = locale === 'ar' && course.title_ar ? course.title_ar : course.title
  const displayDescription =
    locale === 'ar' && course.description_ar ? course.description_ar : course.description
  const imagePath = course.cover_image ?? getCourseImagePath(course.slug)
  const hasImage = imagePath !== null

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-sm transition-shadow hover:shadow-card"
    >
      <Link href={`/courses/${course.slug}`} className="block">
        {hasImage ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-100">
            <Image
              src={imagePath}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 1280px) 100vw, 50vw"
              quality={95}
              priority={priority}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-950/50 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-brand-50 text-brand-800">
            <BookOpen className="h-9 w-9" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="badge-neutral">{course.market}</span>
          <span className="badge-neutral">{course.level}</span>
          <span className="badge-brand">{t('format')}</span>
        </div>

        <Link href={`/courses/${course.slug}`} className="group/title">
          <h2 className="font-heading text-xl font-semibold leading-snug text-text-main transition-colors group-hover/title:text-brand-900">
            {displayTitle}
          </h2>
        </Link>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-text-secondary">{displayDescription}</p>

        <div className="mt-5 grid gap-2 border-y border-surface-300 py-4 text-sm text-text-secondary sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-800" />
            {estimatedModules} {t('modules')}
          </span>
          <span className="inline-flex items-center gap-2">
            <Gauge className="h-4 w-4 text-brand-800" />
            {course.duration || `${t('format')} ${t('download')}`}
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-heading text-2xl font-semibold text-text-main">{price}</div>
            <div className="mt-1 text-xs text-text-muted">
              {'≈'} {tokensFormatted} {tCommon('tokens')} · {t('payWithTokens')}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <Link href={`/courses/${course.slug}`} className="btn-secondary !rounded-lg !px-4 !py-2 !text-xs">
              {t('viewCourse')}
            </Link>
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-text-secondary transition hover:bg-brand-50 hover:text-brand-900"
            >
              <ShoppingCart className="h-4 w-4" />
              {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
