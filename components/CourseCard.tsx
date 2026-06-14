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

const levelColors: Record<string, string> = {
  Beginner: 'border-l-emerald-500',
  Intermediate: 'border-l-amber-500',
  Advanced: 'border-l-rose-500',
  General: 'border-l-brand-500',
}

export function CourseCard({ course }: CourseCardProps) {
  const [currency, setCurrency] = useState('GBP')
  const t = useTranslations('common.buttons')

  useEffect(() => {
    setCurrency(getUserCurrency())
  }, [])

  const priceAmount = calculatePriceForTokens(course.tokens, currency)
  const price = formatPrice(priceAmount, currency)

  const imagePath = course.cover_image ?? (course.slug ? getCourseImagePath(course.slug) : null)
  const hasImage = imagePath !== null
  const accent = levelColors[course.level] || 'border-l-brand-500'

  return (
    <Link
      href={course.slug ? `/courses/${course.slug}` : '#'}
      className={`group flex gap-4 rounded-xl border border-surface-200 border-l-4 ${accent} bg-white p-4 shadow-sm transition-shadow hover:shadow-md`}
    >
      {hasImage && imagePath ? (
        <div className="hidden sm:block relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-100">
          <Image
            src={imagePath}
            alt={course.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      ) : (
        <div className="hidden sm:flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-brand-50">
          <BookOpen className="h-6 w-6 text-brand-600" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-heading text-sm font-semibold text-text-main group-hover:text-brand-800 transition-colors">
            {course.title}
          </h3>
          <span className="shrink-0 rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-text-muted">
            {course.level}
          </span>
          <span className="shrink-0 rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-text-muted">
            {course.market}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">{course.desc}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-base font-bold text-text-main">{price}</span>
            <span className="text-[11px] text-text-muted">{'≈'} {course.tokens.toLocaleString('en-US')} {t('tokens')}</span>
          </div>
          <span className="text-xs font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
            {t('viewDetails')} &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
