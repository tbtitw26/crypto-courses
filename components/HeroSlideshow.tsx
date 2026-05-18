'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'

interface Slide {
  level: string
  market: string
  title: string
  summary: string
  imagePath: string
}

export function HeroSlideshow() {
  const t = useTranslations('home.heroSlideshow')
  const [index, setIndex] = useState(0)

  const slides: Slide[] = [
    {
      level: t('slides.0.level'),
      market: t('slides.0.market'),
      title: t('slides.0.title'),
      summary: t('slides.0.summary'),
      imagePath: '/slide_1.webp',
    },
    {
      level: t('slides.1.level'),
      market: t('slides.1.market'),
      title: t('slides.1.title'),
      summary: t('slides.1.summary'),
      imagePath: '/slide_2.webp',
    },
    {
      level: t('slides.2.level'),
      market: t('slides.2.market'),
      title: t('slides.2.title'),
      summary: t('slides.2.summary'),
      imagePath: '/slide_3.webp',
    },
    {
      level: t('slides.3.level'),
      market: t('slides.3.market'),
      title: t('slides.3.title'),
      summary: t('slides.3.summary'),
      imagePath: '/slide_4.webp',
    },
  ]

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(id)
  }, [slides.length])

  const active = slides[index]

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-heading text-xs font-bold uppercase text-text-muted">{t('labelTop')}</div>
          <div className="text-sm text-text-secondary">{t('labelSub')}</div>
        </div>
        <div className="badge-brand">{t('slideShow')}</div>
      </div>
      <div className="relative overflow-hidden rounded-xl">
        <motion.div
          key={active.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative min-h-[300px] overflow-hidden rounded-xl border border-surface-300 bg-white sm:min-h-[340px]"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src={active.imagePath}
              alt={active.title}
              fill
              className="object-cover opacity-45"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/78 to-white/10" />
          </div>

          <div className="relative z-10 flex flex-col gap-3 px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex items-center gap-2">
              <span className="badge-neutral">{active.level}</span>
              <span className="badge-neutral">{active.market}</span>
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-semibold text-text-main tracking-heading">
              {active.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-lg">
              {active.summary}
            </p>
            <Link
              href="/courses"
              className="mt-2 inline-flex self-start items-center gap-2 rounded-lg bg-surface-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-900"
            >
              <span>{t('ctaViewCourse')}</span>
              <span>→</span>
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              onClick={() => setIndex(i)}
              aria-label={`Show ${slide.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-brand-700' : 'w-2 bg-surface-400 hover:bg-surface-500'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-text-muted font-heading">
          {t('slideCounterPrefix')} {index + 1} {t('slideCounterOf')} {slides.length}
        </span>
      </div>
    </>
  )
}
