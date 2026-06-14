// components/CourseDetailPage.tsx - Course detail page component

'use client'

import { useState, useEffect, useRef } from 'react'
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
  XCircle,
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

const TAB_IDS = ['overview', 'curriculum', 'requirements', 'faq'] as const

export function CourseDetailPage({ course }: CourseDetailPageProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const t = useTranslations('courses.detail')
  const tCart = useTranslations('cart.messages')
  const tBreadcrumb = useTranslations('courses.breadcrumb')
  const [currency, setCurrency] = useState('GBP')
  const [locale, setLocale] = useState('en')
  const [showStickyBar, setShowStickyBar] = useState(false)
  const heroCTARef = useRef<HTMLDivElement>(null)
  const resolvedImagePath = course.cover_image ?? getCourseImagePath(course.slug)

  useEffect(() => {
    setCurrency(getUserCurrency())
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find((c) => c.trim().startsWith('user_locale='))
    if (localeCookie) {
      const loc = localeCookie.split('=')[1]?.trim()
      if (loc === 'ar' || loc === 'en') {
        setLocale(loc)
      }
    }
  }, [])

  // Sticky bottom bar: show when hero CTA scrolls out of view
  useEffect(() => {
    const handleScroll = () => {
      if (!heroCTARef.current) return
      const rect = heroCTARef.current.getBoundingClientRect()
      setShowStickyBar(rect.bottom < 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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

  const displayTitle = locale === 'ar' && course.title_ar ? course.title_ar : course.title
  const displayDescription =
    locale === 'ar' && course.description_ar ? course.description_ar : course.description

  const hasImage = resolvedImagePath !== null

  const dbModules = course.modules && Array.isArray(course.modules) ? course.modules : null
  const fallbackModules = getDefaultModules(course.market, course.level)

  const displayModules = dbModules
    ? dbModules
        .sort((a, b) => a.order - b.order)
        .map((m) => ({
          no: String(m.order).padStart(2, '0'),
          title: m.title,
          desc: m.summary,
        }))
    : fallbackModules

  const estimatedDuration =
    course.duration_hours_min && course.duration_hours_max
      ? `${course.duration_hours_min}–${course.duration_hours_max} hours`
      : `${displayModules.length * 1}–${displayModules.length * 1.5} hours`

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

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
        {/* ===================== 1. FULL-WIDTH EDITORIAL HERO ===================== */}
        <HomeSection className="pb-8 space-y-5">
          {/* Breadcrumb */}
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

          {/* Title */}
          <motion.h1
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-heading text-text-main max-w-3xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {displayTitle}
          </motion.h1>

          {/* Badges inline below title */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-main">
            <span className="btn-primary px-2.5 py-1 rounded-full font-medium text-[11px]">
              {course.level}
            </span>
            <span className="badge-neutral px-2.5 py-1 rounded-full">{course.market}</span>
            <span className="badge-neutral px-2.5 py-1 rounded-full">{t('meta.pdfCourse')}</span>
            <span className="badge-neutral px-2.5 py-1 rounded-full flex items-center gap-1">
              <Globe2 className="w-3 h-3" />
              {t('meta.languages')}
            </span>
          </div>

          {/* Course image - full width, cinematic aspect */}
          {hasImage && (
            <motion.div
              className="relative w-full max-w-4xl mx-auto aspect-[21/9] rounded-xl overflow-hidden border border-surface-300"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            >
              <Image
                src={resolvedImagePath!}
                alt={displayTitle}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                priority
              />
            </motion.div>
          )}

          {/* Description */}
          <p className="text-sm sm:text-base text-text-secondary max-w-3xl">
            {displayDescription}
          </p>

          {/* Horizontal metadata strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted">{t('meta.duration')}:</span>
              <span className="text-text-main">{estimatedDuration} &middot; self-paced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted">{t('meta.modules')}:</span>
              <span className="text-text-main">
                {displayModules.length} {t('meta.modules').toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted">{t('meta.format')}:</span>
              <span className="text-text-main">{t('meta.pdfDownload')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted">{t('meta.focus')}:</span>
              <span className="text-text-main">{t('meta.riskAwareness')}</span>
            </div>
          </div>

          {/* Integrated price + CTA row */}
          <div ref={heroCTARef}>
            <motion.div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-surface-300 rounded-xl px-5 py-4 bg-surface-100/50"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
            >
              <div className="space-y-0.5">
                <div className="text-lg font-semibold text-text-main">{price}</div>
                <div className="text-xs text-text-muted">
                  ≈ {tokensFormatted} tokens &middot; {t('pricing.immediateDownload')}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBuyWithTokens}
                  className="btn-primary inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  {t('pricing.buyWithTokens')}
                </button>
                <button
                  onClick={handleBuyWithCard}
                  className="btn-secondary inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  {t('pricing.buyWithCard')}
                </button>
              </div>
            </motion.div>
          </div>
        </HomeSection>

        {/* ===================== 2. HORIZONTAL TAB NAVIGATION ===================== */}
        <div className="sticky top-[53px] z-10 border-b border-surface-300 glass-panel">
          <HomeSection className="py-0">
            <nav className="flex items-center gap-1 overflow-x-auto -mb-px">
              {TAB_IDS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => scrollTo(`section-${tab}`)}
                  className="px-4 py-3 text-xs font-medium text-text-muted hover:text-text-main border-b-2 border-transparent hover:border-brand-400 transition-colors whitespace-nowrap"
                >
                  {tab === 'overview' && t('whatYouWillLearn.title')}
                  {tab === 'curriculum' && t('outline.title')}
                  {tab === 'requirements' && t('sidebar.whoIsFor.title')}
                  {tab === 'faq' && t('faq.title')}
                </button>
              ))}
            </nav>
          </HomeSection>
        </div>

        {/* ===================== 3. WHAT YOU'LL LEARN - 3-COL GRID ===================== */}
        <HomeSection className="py-10" id="section-overview">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h2 className="text-base sm:text-lg font-semibold font-heading text-text-main mb-5">
              {t('whatYouWillLearn.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: <Layers className="w-4 h-4 text-brand-400" />,
                  text: `How the ${course.market} market is structured and why that matters.`,
                },
                {
                  icon: <ShieldCheck className="w-4 h-4 text-brand-400" />,
                  text: 'How to define and calculate risk per trade before pressing any button.',
                },
                {
                  icon: <FileText className="w-4 h-4 text-brand-400" />,
                  text: 'How to build a simple, minimal trading plan and journal framework.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="border border-surface-300 rounded-xl p-4 space-y-2 bg-surface-100/30"
                >
                  <div className="h-8 w-8 rounded-lg bg-surface-200 flex items-center justify-center border border-surface-400">
                    {item.icon}
                  </div>
                  <p className="text-sm text-text-secondary">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </HomeSection>

        {/* ===================== 4. CURRICULUM - VERTICAL TIMELINE ===================== */}
        <HomeSection className="py-10" id="section-curriculum">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h2 className="text-base sm:text-lg font-semibold font-heading text-text-main mb-1">
              {t('outline.title')}
            </h2>
            <p className="text-sm text-text-secondary mb-6">{t('outline.description')}</p>

            <div className="relative pl-8">
              {/* Vertical connecting line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-surface-400" />

              <div className="space-y-6">
                {displayModules.map((m, i) => (
                  <motion.div
                    key={m.no}
                    className="relative flex gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    {/* Timeline node */}
                    <div className="absolute -left-8 top-0.5 h-7 w-7 rounded-full bg-surface-200 border border-surface-400 flex items-center justify-center text-[11px] font-medium text-text-secondary z-[1]">
                      {m.no}
                    </div>

                    {/* Content */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="text-sm font-semibold text-text-main">{m.title}</div>
                      <div className="text-xs text-text-secondary">{m.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </HomeSection>

        {/* ===================== 5. WHO IS THIS FOR / NOT FOR - TWO COLUMNS ===================== */}
        <HomeSection className="py-10" id="section-requirements">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* For */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold font-heading text-text-main">
                  {t('sidebar.whoIsFor.title')}
                </h2>
                <ul className="space-y-2.5">
                  {[
                    `Complete beginners who want a structured, non-hyped introduction to ${course.market}.`,
                    'Traders who opened a few random positions and realised they need a proper base.',
                    'People who care about risk and process more than short-term excitement.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Not for */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold font-heading text-text-main">
                  {t('sidebar.notFor.title')}
                </h2>
                <ul className="space-y-2.5">
                  {[
                    'It will not give you trade calls or entry alerts.',
                    'It will not promise you any monthly percentage return.',
                    'It will not remove the need for your own discipline, time and practice.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <XCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </HomeSection>

        {/* ===================== 6. MATERIALS INCLUDED - HORIZONTAL STRIP ===================== */}
        <HomeSection className="py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <h2 className="text-sm font-semibold font-heading text-text-main mb-4">
              {t('sidebar.materials.title')}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-2 border border-surface-300 rounded-lg px-3 py-2 bg-surface-100/30">
                <FileText className="w-4 h-4 text-brand-400" />
                Full PDF course (around 80-100 pages)
              </span>
              <span className="inline-flex items-center gap-2 border border-surface-300 rounded-lg px-3 py-2 bg-surface-100/30">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Simple printable risk checklist
              </span>
              <span className="inline-flex items-center gap-2 border border-surface-300 rounded-lg px-3 py-2 bg-surface-100/30">
                <BookOpen className="w-4 h-4 text-brand-400" />
                Basic journaling template (50-100 trades)
              </span>
            </div>
          </motion.div>
        </HomeSection>

        {/* ===================== 7. FAQ - FULL WIDTH ACCORDION ===================== */}
        <HomeSection className="py-10" id="section-faq">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="max-w-2xl mb-5">
              <h2 className="text-base sm:text-lg font-semibold font-heading text-text-main mb-1">
                {t('faq.title')}
              </h2>
              <p className="text-sm text-text-secondary">{t('faq.description')}</p>
            </div>
            <div className="space-y-2 max-w-3xl">
              {['receivePdf', 'refund', 'signals'].map((key) => (
                <details key={key} className="group border border-surface-300 rounded-xl px-4 py-3 text-sm">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-medium text-text-main pr-4">
                      {t(`faq.items.${key}.question`)}
                    </span>
                    <span className="text-text-muted text-xs group-open:rotate-90 transition-transform">
                      ›
                    </span>
                  </summary>
                  <div className="mt-2 text-xs text-text-secondary leading-relaxed">
                    {t(`faq.items.${key}.answer`)}
                  </div>
                </details>
              ))}
            </div>
          </motion.div>
        </HomeSection>

        {/* ===================== 8. CROSS-SELL - HORIZONTAL CARD PAIR ===================== */}
        <HomeSection className="py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Custom Course */}
              <div className="border border-surface-300 rounded-xl p-5 space-y-3 bg-surface-100/30">
                <div className="badge-neutral inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] w-max">
                  <CheckCircle2 className="w-3 h-3 text-brand-400" />
                  <span>{t('sidebar.customCourse.badge')}</span>
                </div>
                <p className="text-sm text-text-secondary">
                  {t('sidebar.customCourse.description')}
                </p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                >
                  <span>{t('sidebar.customCourse.cta')}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* AI Strategy */}
              <div className="border border-surface-300 rounded-xl p-5 space-y-3 bg-surface-100/30">
                <div className="badge-neutral inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] w-max">
                  <Cpu className="w-3 h-3 text-brand-400" />
                  <span>{t('sidebar.aiStrategy.badge')}</span>
                </div>
                <p className="text-sm text-text-secondary">{t('sidebar.aiStrategy.description')}</p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                >
                  <span>{t('sidebar.aiStrategy.cta')}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </HomeSection>

        {/* ===================== 9. RISK REMINDER - COMPACT GOLD BANNER ===================== */}
        <HomeSection className="py-6">
          <div className="border border-amber-500/40 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-amber-500/5">
            <div className="flex items-center gap-2 text-sm text-amber-200 shrink-0">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">{t('sidebar.riskReminder.title')}</span>
            </div>
            <p className="text-xs text-text-main/90 flex-1">
              {t('sidebar.riskReminder.description')}
            </p>
            <Link
              href="/risk-and-disclaimer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 shrink-0"
            >
              <span>{t('sidebar.riskReminder.cta')}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </HomeSection>

        {/* ===================== 10. BOTTOM CTA - ASYMMETRIC LAYOUT ===================== */}
        <HomeSection className="py-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center border border-surface-300 rounded-xl px-6 py-8 bg-surface-100/30">
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold font-heading text-text-main">
                {t('cta.title', { courseTitle: displayTitle })}
              </h2>
              <p className="text-sm text-text-secondary max-w-xl">{t('cta.description')}</p>
              <div className="flex items-start gap-2 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400 mt-0.5" />
                <span className="text-xs text-text-muted">{t('pricing.educationDisclaimer')}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full"
              >
                {t('cta.buyCourse')}
              </button>
              <Link
                href="/courses"
                className="btn-secondary inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-full"
              >
                {t('cta.viewMore')}
              </Link>
            </div>
          </div>
        </HomeSection>
      </main>

      {/* ===================== 11. STICKY BOTTOM PURCHASE BAR ===================== */}
      <div
        className={`fixed bottom-0 inset-x-0 z-30 border-t border-surface-300 glass-panel transition-transform duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <HomeSection className="py-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-text-main">{price}</div>
            <div className="text-[11px] text-text-muted truncate max-w-[200px] sm:max-w-none">
              {displayTitle}
            </div>
          </div>
          <button
            onClick={handleBuyWithTokens}
            className="btn-primary inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium shrink-0"
          >
            {t('pricing.buyWithTokens')}
          </button>
        </HomeSection>
      </div>
    </div>
  )
}
