// components/CourseCard.tsx - Course card component

'use client'

import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useState, useEffect } from 'react'

interface CourseCardProps {
  course: {
    level: string
    market: string
    title: string
    desc: string
    price_gbp: number
    tokens: number
    slug?: string
    cover_image?: string | null
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const [currency, setCurrency] = useState('GBP')
  const t = useTranslations('common.buttons')

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  // Calculate price from tokens: 1.00 GBP = 100 tokens
  const priceAmount = calculatePriceForTokens(course.tokens, currency)
  const price = formatPrice(priceAmount, currency)

  // Get course image path
  const imagePath = course.cover_image ?? (course.slug ? getCourseImagePath(course.slug) : null)
  const hasImage = imagePath !== null

  return (
    <div className="group flex flex-col rounded-2xl border border-surface-200 bg-white p-5 gap-4 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
      {hasImage && imagePath ? (
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-surface-100 relative">
          <Image
            src={imagePath}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-brand-500/20 via-surface-200 to-surface-100 flex items-center justify-center text-xs text-text-muted">
          {t('courseCover')}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs">
        <span className="badge-neutral font-heading">
          {course.level}
        </span>
        <span className="badge-neutral font-heading">
          {course.market}
        </span>
        <span className="badge-neutral font-heading">
          PDF
        </span>
      </div>
      <div className="flex items-start gap-2">
        <BookOpen className="w-5 h-5 text-brand-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-heading text-base font-semibold text-text-main mb-1">{course.title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{course.desc}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-surface-300">
        <div>
          <div className="font-heading text-lg font-bold text-text-main">{price}</div>
          <div className="text-xs text-text-muted">{'≈'} {course.tokens.toLocaleString('en-US')} {t('tokens')}</div>
        </div>
        <Link
          href={course.slug ? `/courses/${course.slug}` : '#'}
          className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium text-sm"
        >
          <span>{t('viewDetails')}</span>
          <span className="inline-block translate-x-0 group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  )
}
