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
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl p-5 gap-4 hover:border-cyan-400/70 hover:-translate-y-1 transition-all duration-150 shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
      {hasImage && imagePath ? (
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 relative">
          <Image
            src={imagePath}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-slate-700/40 via-slate-900 to-slate-950 flex items-center justify-center text-xs text-slate-300/70">
          {t('courseCover')}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
        <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/70">
          {course.level}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/70">
          {course.market}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/70">
          PDF
        </span>
      </div>
      <div className="flex items-start gap-2">
        <BookOpen className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-slate-50 mb-1">{course.title}</h3>
          <p className="text-xs text-slate-300/80 leading-relaxed">{course.desc}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-800/80 text-sm">
        <div>
          <div className="font-semibold text-slate-50">{price}</div>
          <div className="text-[11px] text-slate-400">≈ {course.tokens.toLocaleString('en-US')} {t('tokens')}</div>
        </div>
        <Link
          href={course.slug ? `/courses/${course.slug}` : '#'}
          className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200"
        >
          <span>{t('viewDetails')}</span>
          <span className="inline-block translate-x-0 group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </Link>
      </div>
    </div>
  )
}

