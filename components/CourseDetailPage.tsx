// components/CourseDetailPage.tsx - Course detail page component

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  BookOpen,
  FileText,
  Gauge,
  Layers,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cpu,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { HomeSection } from './HomeSection'
import { calculatePriceForTokens, formatPrice } from '@/lib/currency-utils'
import { getUserCurrency } from '@/lib/currency-client'
import { getCourseImagePath } from '@/lib/course-image-utils'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'

interface CourseModule {
  order: number
  title: string
  summary: string
}

interface CourseDetailPageProps {
  course: {
    id: number
    slug: string
    title: string
    title_ar?: string
    description: string
    description_ar?: string
    level: string
    market: string
    tokens: number
    price_gbp: number
    pdf_path: string
    cover_image?: string | null
    featured: boolean
    modules?: CourseModule[] | null
    duration_hours_min?: number | null
    duration_hours_max?: number | null
  }
}

// Static modules data - can be moved to DB later
const getDefaultModules = (market: string, level: string) => {
  if (market === 'Forex' && level === 'Beginner') {
    return [
      {
        no: '01',
        title: 'How the Forex market is structured',
        desc: 'Sessions, major pairs, liquidity and where your orders actually travel in the system.',
      },
      {
        no: '02',
        title: 'Core terms & order types',
        desc: 'Market vs limit, stop orders, spreads, slippage and how this affects execution.',
      },
      {
        no: '03',
        title: 'Risk per trade & position sizing',
        desc: 'Calculating % risk, lot size and why a small, consistent risk model matters more than setups.',
      },
      {
        no: '04',
        title: 'Basic price structure & candles',
        desc: 'Trends, ranges, support/resistance and how to read candles without overcomplicating charts.',
      },
      {
        no: '05',
        title: 'Building your first simple plan',
        desc: 'Turning theory into a minimal trading plan you can actually follow and review.',
      },
      {
        no: '06',
        title: 'Journaling and review',
        desc: 'What to track, how to log trades and how to run weekly reviews to learn from data.',
      },
      {
        no: '07',
        title: 'Common beginner traps',
        desc: 'Overtrading, revenge trading, sizing up too fast and how to build guardrails against them.',
      },
    ]
  }
  // Default modules for other courses
  return [
    {
      no: '01',
      title: 'Introduction and fundamentals',
      desc: 'Core concepts and market structure.',
    },
    {
      no: '02',
      title: 'Risk management basics',
      desc: 'Understanding risk and position sizing.',
    },
    {
      no: '03',
      title: 'Practical application',
      desc: 'Applying concepts in real scenarios.',
    },
  ]
}

export function CourseDetailPage({ course }: CourseDetailPageProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const t = useTranslations('courses.detail')
  const tCart = useTranslations('cart.messages')
  const tBreadcrumb = useTranslations('courses.breadcrumb')
  const [currency, setCurrency] = useState('GBP')
  const [locale, setLocale] = useState('en')
  const resolvedImagePath = course.cover_image ?? getCourseImagePath(course.slug)

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
    addToCart({
      id: course.id,
      slug: course.slug,
      title: course.title,
      title_ar: course.title_ar,
      tokens: course.tokens,
      price_gbp: course.price_gbp,
      image: resolvedImagePath || undefined,
    })
    showToast({
      title: tCart('addedToCart'),
      variant: 'success',
    })
  }

  const handleBuyWithTokens = () => {
    handleAddToCart()
    router.push('/checkout')
  }

  const handleBuyWithCard = () => {
    handleAddToCart()
    router.push('/checkout')
  }

  const priceAmount = calculatePriceForTokens(course.tokens, currency)
  const price = formatPrice(priceAmount, currency)
  const tokensFormatted = course.tokens.toLocaleString('en-US')

  // Use localized title and description if available
  const displayTitle = locale === 'ar' && course.title_ar ? course.title_ar : course.title
  const displayDescription =
    locale === 'ar' && course.description_ar ? course.description_ar : course.description

  const hasImage = resolvedImagePath !== null

  // Use modules from DB if available, otherwise fallback to static data
  const dbModules = course.modules && Array.isArray(course.modules) ? course.modules : null
  const fallbackModules = getDefaultModules(course.market, course.level)

  // Transform DB modules to display format
  const displayModules = dbModules
    ? dbModules
        .sort((a, b) => a.order - b.order)
        .map((m) => ({
          no: String(m.order).padStart(2, '0'),
          title: m.title,
          desc: m.summary,
        }))
    : fallbackModules

  // Use duration from DB if available, otherwise calculate from modules
  const estimatedDuration =
    course.duration_hours_min && course.duration_hours_max
      ? `${course.duration_hours_min}–${course.duration_hours_max} hours`
      : `${displayModules.length * 1}–${displayModules.length * 1.5} hours`

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-surface-300 glass-panel">
        <HomeSection className="py-3 flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs text-text-muted ml-auto">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-brand-400" />
              {t('header.educationOnly')}
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-brand-400" />
              {t('header.pdfFormat')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/courses')}
              className="btn-secondary inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full"
            >
              {t('header.backToCourses')}
            </button>
          </div>
        </HomeSection>
      </header>

      <main className="pt-6">
        {/* Breadcrumb + hero meta */}
        <HomeSection className="pb-6 space-y-6">
          <div className="flex flex-col gap-3">
            <div className="text-xs text-text-muted flex items-center gap-1">
              <Link href="/" className="hover:text-text-secondary">
                {tBreadcrumb('home')}
              </Link>
              <span className="text-text-muted/50">/</span>
              <Link href="/courses" className="hover:text-text-secondary">
                {tBreadcrumb('courses')}
              </Link>
              <span className="text-text-muted/50">/</span>
              <span className="text-text-secondary">{displayTitle}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: main info */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-main">
                  <span className="btn-primary px-2.5 py-1 rounded-full font-medium text-[11px]">
                    {course.level}
                  </span>
                  <span className="badge-neutral px-2.5 py-1 rounded-full">
                    {course.market}
                  </span>
                  <span className="badge-neutral px-2.5 py-1 rounded-full">
                    {t('meta.pdfCourse')}
                  </span>
                  <span className="badge-neutral px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    {t('meta.languages')}
                  </span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold font-heading text-text-main">
                    {displayTitle}
                  </h1>
                  {hasImage && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-surface-300">
                      <Image
                        src={resolvedImagePath!}
                        alt={displayTitle}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                    </div>
                  )}
                  <p className="text-sm sm:text-base text-text-secondary max-w-2xl">{displayDescription}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-text-secondary">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-text-muted">
                      <Gauge className="w-3 h-3" />
                      <span>{t('meta.duration')}</span>
                    </div>
                    <div className="text-text-main">{estimatedDuration} · self-paced</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-text-muted">
                      <Layers className="w-3 h-3" />
                      <span>{t('meta.modules')}</span>
                    </div>
                    <div className="text-text-main">
                      {displayModules.length} {t('meta.modules').toLowerCase()}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-text-muted">
                      <FileText className="w-3 h-3" />
                      <span>{t('meta.format')}</span>
                    </div>
                    <div className="text-text-main">{t('meta.pdfDownload')}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-text-muted">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{t('meta.focus')}</span>
                    </div>
                    <div className="text-text-main">{t('meta.riskAwareness')}</div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-3 text-xs text-text-secondary space-y-1.5">
                  <div className="font-semibold text-text-main text-xs">
                    {t('whatYouWillLearn.title')}
                  </div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>How the {course.market} market is structured and why that matters.</li>
                    <li>
                      How to define and calculate risk per trade before pressing any button.
                    </li>
                    <li>
                      How to build a simple, minimal trading plan and journal framework.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right: pricing & purchase */}
              <div className="lg:col-span-5">
                <motion.div
                  className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-surface-200 flex items-center justify-center border border-surface-400">
                        <BookOpen className="w-4 h-4 text-brand-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-text-main">
                          {t('pricing.courseAccess')}
                        </div>
                        <div className="text-xs text-text-muted">
                          {t('pricing.immediateDownload')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-text-main">{price}</div>
                      <div className="text-xs text-text-muted">
                        ≈ {tokensFormatted} tokens
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <button
                      onClick={handleBuyWithTokens}
                      className="btn-primary inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs"
                    >
                      <span>{t('pricing.buyWithTokens')}</span>
                    </button>
                    <button
                      onClick={handleBuyWithCard}
                      className="btn-secondary inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-medium transition"
                    >
                      <span>{t('pricing.buyWithCard')}</span>
                    </button>
                  </div>

                  <div className="text-xs text-text-muted space-y-1.5">
                    <div>{t('pricing.paymentNote')}</div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-400 mt-0.5" />
                      <span>{t('pricing.educationDisclaimer')}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-3 border-t border-surface-300 text-xs text-text-muted space-y-1.5">
                    <div className="font-medium text-text-main">{t('pricing.beforeBuying')}</div>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>{t('pricing.riskNote1')}</li>
                      <li>{t('pricing.riskNote2')}</li>
                    </ul>
                    <Link
                      href="/risk-and-disclaimer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                    >
                      <span>{t('pricing.readDisclaimer')}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </HomeSection>

        {/* Course outline */}
        <HomeSection className="pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold font-heading text-text-main mb-1">
                    {t('outline.title')}
                  </h2>
                  <p className="text-sm text-text-secondary">{t('outline.description')}</p>
                </div>
              </div>

              <div className="space-y-2">
                {displayModules.map((m) => (
                  <motion.div
                    key={m.no}
                    className="flex gap-3 glass-panel rounded-2xl p-3"
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  >
                    <div className="h-8 w-8 rounded-xl bg-surface-200 flex items-center justify-center border border-surface-400 text-[11px] text-text-secondary">
                      {m.no}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-text-main">{m.title}</div>
                      <div className="text-xs text-text-secondary">{m.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Who this is for / not for */}
            <div className="lg:col-span-5 space-y-4 lg:pt-[70px]">
              <motion.div
                className="glass-panel rounded-2xl p-4 flex flex-col gap-2"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <h2 className="text-xs font-semibold font-heading text-text-main mb-1">
                  {t('sidebar.whoIsFor.title')}
                </h2>
                <ul className="text-xs text-text-secondary space-y-1.5">
                  <li>
                    Complete beginners who want a structured, non-hyped introduction to{' '}
                    {course.market}.
                  </li>
                  <li>
                    Traders who opened a few random positions and realised they need a proper
                    base.
                  </li>
                  <li>
                    People who care about risk and process more than short-term excitement.
                  </li>
                </ul>
              </motion.div>

              <motion.div
                className="glass-panel rounded-2xl p-4 flex flex-col gap-2"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <h2 className="text-xs font-semibold font-heading text-text-main mb-1">
                  {t('sidebar.notFor.title')}
                </h2>
                <ul className="text-xs text-text-secondary space-y-1.5">
                  <li>It will not give you trade calls or entry alerts.</li>
                  <li>It will not promise you any monthly percentage return.</li>
                  <li>
                    It will not remove the need for your own discipline, time and practice.
                  </li>
                </ul>
              </motion.div>

              <motion.div
                className="glass-panel rounded-2xl p-4 flex flex-col gap-2"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <h2 className="text-xs font-semibold font-heading text-text-main mb-1">
                  {t('sidebar.materials.title')}
                </h2>
                <ul className="text-xs text-text-secondary space-y-1.5">
                  <li>Full PDF course (around 80-100 pages).</li>
                  <li>
                    Simple printable risk checklist you can keep near your screen.
                  </li>
                  <li>
                    Basic journaling template to log your first 50-100 trades.
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </HomeSection>

        {/* FAQ about this course */}
        <HomeSection className="pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-3">
              <div className="max-w-xl">
                <h2 className="text-sm sm:text-base font-semibold font-heading text-text-main mb-1">
                  {t('faq.title')}
                </h2>
                <p className="text-sm text-text-secondary">{t('faq.description')}</p>
              </div>
              <div className="space-y-2">
                <details className="group glass-panel rounded-2xl px-3 py-2 text-sm">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-medium text-text-main pr-4">
                      {t('faq.items.receivePdf.question')}
                    </span>
                    <span className="text-text-muted text-xs group-open:rotate-90 transition-transform">
                      ›
                    </span>
                  </summary>
                  <div className="mt-2 text-xs text-text-secondary leading-relaxed">
                    {t('faq.items.receivePdf.answer')}
                  </div>
                </details>
                <details className="group glass-panel rounded-2xl px-3 py-2 text-sm">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-medium text-text-main pr-4">
                      {t('faq.items.refund.question')}
                    </span>
                    <span className="text-text-muted text-xs group-open:rotate-90 transition-transform">
                      ›
                    </span>
                  </summary>
                  <div className="mt-2 text-xs text-text-secondary leading-relaxed">
                    {t('faq.items.refund.answer')}
                  </div>
                </details>
                <details className="group glass-panel rounded-2xl px-3 py-2 text-sm">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-medium text-text-main pr-4">
                      {t('faq.items.signals.question')}
                    </span>
                    <span className="text-text-muted text-xs group-open:rotate-90 transition-transform">
                      ›
                    </span>
                  </summary>
                  <div className="mt-2 text-xs text-text-secondary leading-relaxed">
                    {t('faq.items.signals.answer')}
                  </div>
                </details>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3 lg:pt-[70px]">
              <motion.div
                className="glass-panel rounded-2xl p-4 flex flex-col gap-2"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="badge-neutral inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] w-max">
                  <CheckCircle2 className="w-3 h-3 text-brand-400" />
                  <span>{t('sidebar.customCourse.badge')}</span>
                </div>
                <p className="text-xs text-text-secondary">
                  {t('sidebar.customCourse.description')}
                </p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                >
                  <span>{t('sidebar.customCourse.cta')}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </motion.div>

              <motion.div
                className="glass-panel rounded-2xl p-4 flex flex-col gap-2"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="badge-neutral inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] w-max">
                  <Cpu className="w-3 h-3 text-brand-400" />
                  <span>{t('sidebar.aiStrategy.badge')}</span>
                </div>
                <p className="text-xs text-text-secondary">{t('sidebar.aiStrategy.description')}</p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                >
                  <span>{t('sidebar.aiStrategy.cta')}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </motion.div>

              <motion.div
                className="glass-panel rounded-2xl border-amber-500/40 p-4 flex flex-col gap-2"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">{t('sidebar.riskReminder.title')}</span>
                </div>
                <p className="text-xs text-text-main/90">
                  {t('sidebar.riskReminder.description')}
                </p>
                <Link
                  href="/risk-and-disclaimer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 mt-1"
                >
                  <span>{t('sidebar.riskReminder.cta')}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </motion.div>
            </div>
          </div>
        </HomeSection>

        {/* Bottom CTA */}
        <HomeSection className="pb-10">
          <motion.div
            className="glass-panel rounded-2xl px-5 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div>
              <h2 className="text-sm sm:text-base font-semibold font-heading text-text-main mb-1">
                {t('cta.title', { courseTitle: displayTitle })}
              </h2>
              <p className="text-sm text-text-secondary max-w-xl">{t('cta.description')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="btn-primary inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-full"
              >
                {t('cta.buyCourse')}
              </button>
              <Link
                href="/courses"
                className="btn-secondary inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-full"
              >
                {t('cta.viewMore')}
              </Link>
            </div>
          </motion.div>
        </HomeSection>
      </main>
    </div>
  )
}
