'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Coins,
  Cpu,
  Download,
  FileText,
  GraduationCap,
  Layers,
  Library,
  LineChart,
  PenLine,
  Shield,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { HeroSlideshow } from '@/components/HeroSlideshow'
import { TradingViewWidget } from '@/components/TradingViewWidget'
import { CourseCard } from '@/components/CourseCard'
import FAQAccordion from '@/components/FAQAccordion'
import { TokenPacks } from '@/components/TokenPacks'
import { TestimonialsVideos } from '@/components/TestimonialsVideos'

interface FeaturedCourse {
  level: string
  market: string
  title: string
  desc: string
  price_gbp: number
  tokens: number
  slug: string
  cover_image?: string | null
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}

function Inner({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-page px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

export default function HomePage() {
  const t = useTranslations('home')
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  useEffect(() => {
    async function fetchFeaturedCourses() {
      setIsLoadingCourses(true)
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const payload = await response.json()
          const courses = Array.isArray(payload) ? payload : payload?.data

          if (!Array.isArray(courses)) {
            console.warn('Unexpected /api/courses payload shape, using empty array', {
              keys: payload ? Object.keys(payload) : null,
            })
            setFeaturedCourses([])
            return
          }

          const beginnerCourse = courses.find((course: any) => course.level === 'Beginner')
          const intermediateCourse = courses.find((course: any) => course.level === 'Intermediate')
          const advancedCourse = courses.find((course: any) => course.level === 'Advanced')
          const selectedCourses: FeaturedCourse[] = []

          const truncateDescription = (desc: string, maxLength: number = 120): string => {
            if (!desc) return ''
            if (desc.length <= maxLength) return desc
            return `${desc.substring(0, maxLength).trim()}...`
          }

          ;[beginnerCourse, intermediateCourse, advancedCourse].forEach((course) => {
            if (!course) return
            selectedCourses.push({
              level: course.level,
              market: course.market,
              title: course.title,
              desc: truncateDescription(course.description || ''),
              price_gbp: Number(course.price_gbp),
              tokens: course.tokens,
              slug: course.slug,
              cover_image: course.cover_image,
            })
          })

          setFeaturedCourses(selectedCourses)
        } else {
          console.warn('Failed to fetch courses, using empty array')
          setFeaturedCourses([])
        }
      } catch (error) {
        console.error('Error fetching featured courses:', error)
        setFeaturedCourses([])
      } finally {
        setIsLoadingCourses(false)
      }
    }

    fetchFeaturedCourses()
  }, [])

  const pathways = t.raw('paths.items') as Array<{
    title: string
    text: string
    badge?: string
    cta: string
  }>
  const workflowSteps = t.raw('howItWorks.steps') as Array<{ title: string; text: string }>
  const tokenItems = t.raw('tokensTeaser.items') as Array<{ title: string; text: string }>
  const glossaryItems = t.raw('glossaryResources.glossary.items') as Array<{
    term: string
    definition: string
  }>
  const resourceItems = t.raw('glossaryResources.resources.items') as Array<{
    label: string
    definition: string
  }>

  const pathwayIcons = [Library, PenLine, BrainCircuit]
  const pathwayHrefs = ['/courses', '/learn?tab=custom', '/learn?tab=ai']

  return (
    <div className="relative overflow-x-hidden">
      <main className="relative z-10">
        {/* ─────────────────────────── HERO ─────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-white via-surface-0 to-white">
          {/* Subtle dot-grid texture */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(circle, #007d7a 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
          </div>

          <Inner className="relative">
            {/* Education-only compliance strip */}
            <div className="flex items-center justify-between border-b border-surface-200 py-3.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-gold-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-semibold uppercase tracking-wider">
                    {t('hero.badgeRight')}
                  </span>
                </span>
                <span className="hidden text-text-muted sm:block">
                  No signals. No promises. No financial advice.
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-text-muted">
                <ShieldCheck className="h-3 w-3 text-brand-600" />
                <span>{t('hero.badgeLeft')}</span>
              </span>
            </div>

            {/* Hero content — asymmetric editorial + product card */}
            <div className="grid gap-10 pb-10 pt-14 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:pb-14 lg:pt-20">
              {/* Editorial column */}
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/70 px-3.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                    Trading Education OS
                  </span>
                </div>

                <h1 className="font-heading text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-text-main sm:text-5xl lg:text-[3.25rem]">
                  {t('hero.title')}
                </h1>

                <p className="mt-5 max-w-xl text-lg leading-8 text-text-secondary">
                  {t('hero.subtitle')}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/courses" className="btn-primary">
                    {t('hero.ctaPrimaryLabel')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/learn" className="btn-secondary">
                    {t('hero.ctaSecondaryLabel')}
                  </Link>
                </div>

                {/* Education pillars */}
                <div className="mt-8 grid gap-2">
                  {(t.raw('hero.bullets') as string[]).map((bullet, i) => (
                    <div key={bullet} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                        {i === 0 && <Shield className="h-3 w-3" />}
                        {i === 1 && <FileText className="h-3 w-3" />}
                        {i === 2 && <BrainCircuit className="h-3 w-3" />}
                      </span>
                      <span className="text-sm leading-relaxed text-text-secondary">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product ecosystem card */}
              <div>
                <div className="rounded-2xl border border-surface-200 bg-white shadow-card">
                  <div className="border-b border-surface-200 px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      Platform architecture
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-surface-200">
                    {[
                      {
                        icon: Library,
                        label: 'PDF Courses',
                        desc: 'Structured by market and level',
                        accent: 'bg-brand-50 text-brand-700',
                      },
                      {
                        icon: PenLine,
                        label: 'Custom PDFs',
                        desc: 'Tailored by a professional trader',
                        accent: 'bg-brand-50 text-brand-600',
                      },
                      {
                        icon: BrainCircuit,
                        label: 'AI Strategies',
                        desc: 'Generated plans with risk logic',
                        accent: 'bg-surface-100 text-ai',
                      },
                      {
                        icon: WalletCards,
                        label: 'Token Wallet',
                        desc: 'One balance, all products',
                        accent: 'bg-gold-50 text-gold-600',
                      },
                    ].map(({ icon: Icon, label, desc, accent }) => (
                      <div key={label} className="flex flex-col gap-2.5 bg-white p-5">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-semibold text-text-main">{label}</p>
                        <p className="text-sm leading-snug text-text-muted">{desc}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/learn?tab=ai"
                    className="flex items-center justify-between border-t border-surface-200 px-5 py-3.5 text-sm transition-colors hover:bg-surface-0"
                  >
                    <span className="flex items-center gap-2.5">
                      <Cpu className="h-4 w-4 text-ai" />
                      <span className="font-medium text-text-main">Open AI Strategy Builder</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Course slideshow */}
            <div className="pb-10 lg:pb-14">
              <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
                <HeroSlideshow />
              </div>
            </div>

            {/* Risk disclaimer */}
            <div className="mb-10 flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50/60 px-5 py-4 sm:mb-14 lg:mb-16">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
              <p className="text-sm leading-relaxed text-text-secondary">
                {t('marketSnapshot.disclaimer')}
              </p>
            </div>
          </Inner>
        </div>


        {/* ─────────────── PRODUCT OPERATING SYSTEM ─────────────── */}
        <Section className="border-b border-surface-200 bg-white py-20 lg:py-24">
          <Inner>
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-700">
                The platform
              </p>
              <h2 className="font-heading text-3xl font-semibold leading-tight text-text-main sm:text-4xl">
                A connected education system, not a content dump.
              </h2>
              <p className="mt-4 text-base leading-7 text-text-secondary">
                Every Avenqor product feeds into a single dashboard. Courses, custom PDFs, AI
                strategies, tokens, and receipts — all in one place.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-surface-200 bg-surface-200 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  icon: Library,
                  title: 'Course Library',
                  desc: 'Structured PDFs by market and level',
                  color: 'text-brand-700',
                },
                {
                  icon: PenLine,
                  title: 'Custom Builder',
                  desc: 'Request a tailored course from a pro trader',
                  color: 'text-brand-700',
                },
                {
                  icon: BrainCircuit,
                  title: 'AI Strategy',
                  desc: 'Generate structured trading plans instantly',
                  color: 'text-ai',
                },
                {
                  icon: WalletCards,
                  title: 'Token Wallet',
                  desc: 'One balance across all products',
                  color: 'text-gold-600',
                },
                {
                  icon: Download,
                  title: 'Dashboard',
                  desc: 'Downloads, receipts, generation status',
                  color: 'text-brand-700',
                },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex flex-col gap-3 bg-white p-6">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <h3 className="text-sm font-semibold text-text-main">{title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{desc}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Section>

        {/* ─────────────────── LEARNING PATHS ─────────────────── */}
        <Section className="py-20 lg:py-24">
          <Inner>
            <div className="mb-12 max-w-2xl">
              <div className="badge-brand mb-4">
                <GraduationCap className="h-3.5 w-3.5" />
                Learning paths
              </div>
              <h2 className="section-heading">{t('paths.title')}</h2>
              <p className="section-subheading mt-4">{t('paths.subtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {pathways.map((item, index) => {
                const Icon = pathwayIcons[index]
                const isAI = index === 2
                return (
                  <div
                    key={item.title}
                    className={`group relative flex flex-col rounded-2xl p-7 transition-shadow hover:shadow-card-hover ${
                      isAI
                        ? 'border border-surface-700 bg-surface-950 text-white'
                        : index === 1
                          ? 'border-2 border-brand-200 bg-brand-50/50'
                          : 'border border-surface-200 bg-white'
                    }`}
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          isAI
                            ? 'border border-white/10 bg-white/8 text-brand-300'
                            : 'border border-surface-200 bg-surface-0 text-brand-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      {item.badge && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isAI
                              ? 'bg-brand-500/15 text-brand-300'
                              : 'bg-gold-50 text-gold-700 border border-gold-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3
                      className={`font-heading text-lg font-semibold ${isAI ? 'text-white' : 'text-text-main'}`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`mt-3 text-sm sm:text-base leading-6 ${isAI ? 'text-surface-300' : 'text-text-secondary'}`}
                    >
                      {item.text}
                    </p>
                    <Link
                      href={pathwayHrefs[index]}
                      className={`mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold ${
                        isAI ? 'text-brand-300' : 'text-brand-700'
                      }`}
                    >
                      {item.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </Inner>
        </Section>

        {/* ─────────────────── FEATURED COURSES ─────────────────── */}
        <Section className="border-y border-surface-200 bg-white py-20 lg:py-24">
          <Inner>
            <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <div className="badge-brand mb-4">
                  <BookOpen className="h-3.5 w-3.5" />
                  Course library
                </div>
                <h2 className="section-heading">{t('featuredCourses.title')}</h2>
                <p className="section-subheading mt-4">{t('featuredCourses.subtitle')}</p>
              </div>
              <Link href="/courses" className="btn-secondary shrink-0">
                {t('featuredCourses.ctaViewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {isLoadingCourses ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-surface-200 bg-white p-5">
                    <div className="skeleton aspect-[16/9]" />
                    <div className="mt-5 h-4 w-3/4 rounded bg-surface-200" />
                    <div className="mt-4 h-3 w-full rounded bg-surface-200" />
                    <div className="mt-2 h-3 w-5/6 rounded bg-surface-200" />
                  </div>
                ))
              ) : featuredCourses.length > 0 ? (
                featuredCourses.map((course) => <CourseCard key={course.slug} course={course} />)
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center text-sm text-text-muted">
                  No courses available at the moment.
                </div>
              )}
            </div>
          </Inner>
        </Section>

        {/* ────────────── CUSTOM + AI SPLIT SECTION ────────────── */}
        <Section className="py-20 lg:py-24">
          <Inner>
            <div className="mb-12 max-w-2xl">
              <div className="badge-brand mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Custom and AI workflow
              </div>
              <h2 className="section-heading">{t('howItWorks.title')}</h2>
              <p className="section-subheading mt-3">{t('howItWorks.subtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Custom course */}
              <div className="relative overflow-hidden rounded-2xl border border-surface-200 bg-white">
                <div className="border-b border-surface-200 bg-surface-0 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
                      <PenLine className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-text-main">
                        Custom Course PDF
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Built by a professional trader
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-7">
                  <div className="mb-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                      You provide
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Experience level',
                        'Deposit size',
                        'Risk tolerance',
                        'Market',
                        'Goals',
                      ].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-surface-200 bg-surface-0 px-3 py-1.5 text-xs text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                      You receive
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Structured PDF course', 'Custom modules', 'Email delivery'].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href="/learn?tab=custom" className="btn-primary w-full justify-center">
                    Request custom course
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* AI strategy */}
              <div className="relative overflow-hidden rounded-2xl border border-surface-700 bg-surface-950">
                <div className="border-b border-white/10 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-brand-300">
                      <BrainCircuit className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-white">
                        AI Strategy Document
                      </h3>
                      <p className="text-sm text-surface-400">Generated in seconds</p>
                    </div>
                  </div>
                </div>
                <div className="p-7">
                  <div className="mb-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-surface-500">
                      You provide
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Market', 'Timeframe', 'Risk per trade', 'Instruments', 'Focus'].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-surface-300"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="mb-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-surface-500">
                      You receive
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Strategy PDF', 'Entry/exit logic', 'Risk checklist'].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href="/learn?tab=ai" className="btn-primary w-full justify-center">
                    Build AI strategy
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Workflow steps */}
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-surface-200 bg-surface-200 sm:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="flex flex-col gap-3 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-3xl font-bold text-surface-200">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-text-main">{step.title}</h4>
                  <p className="text-sm leading-relaxed text-text-secondary">{step.text}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Section>

        {/* ─────────────── TOKEN WALLET / PRICING ─────────────── */}
        <div className="bg-surface-950 text-white">
          <Section className="py-20 lg:py-24">
            <Inner>
              <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
                <div>
                  <div className="badge-gold mb-4">
                    <Coins className="h-3.5 w-3.5" />
                    Token economy
                  </div>
                  <h2 className="font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
                    {t('tokensTeaser.title')}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-surface-300">
                    {t('tokensTeaser.subtitle')}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white px-6 py-3 text-sm font-semibold text-surface-950 transition hover:bg-brand-50"
                    >
                      {t('tokensTeaser.ctaPricing')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/top-up"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Top up balance
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {tokenItems.map((item, index) => {
                    const icons = [Coins, WalletCards, FileText]
                    const Icon = icons[index]
                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-surface-400">
                          {item.text}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Inner>
          </Section>
        </div>

        {/* ─────────────────── TOKEN PACKS ─────────────────── */}
        <div className="pt-20">
          <TokenPacks />
        </div>

        {/* ─────────────────── MARKET CONTEXT ─────────────────── */}
        <Section className="py-20 lg:py-24">
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
              <div>
                <div className="mb-4 rounded-2xl border border-surface-200 bg-surface-950 p-3 shadow-card">
                  <TradingViewWidget />
                </div>
              </div>
              <div className="space-y-5 lg:sticky lg:top-24">
                <div className="badge-neutral">
                  <LineChart className="h-3.5 w-3.5" />
                  Market education snapshot
                </div>
                <h2 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">
                  {t('marketSnapshot.title')}
                </h2>
                <p className="text-base leading-7 text-text-secondary">
                  {t('marketSnapshot.subtitle')}
                </p>
                <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t('marketSnapshot.disclaimer')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Inner>
        </Section>

        {/* ─────────────────── TESTIMONIALS ─────────────────── */}
        <section className="border-y border-surface-200 bg-white py-20 lg:py-24">
          <Inner>
            <TestimonialsVideos />
          </Inner>
        </section>

        {/* ─────────────── RESOURCES + GLOSSARY ─────────────── */}
        <Section className="py-20 lg:py-24">
          <Inner>
            <div className="grid gap-6 lg:grid-cols-2">
              <ResourcePanel
                icon={BookOpen}
                title={t('glossaryResources.glossary.title')}
                subtitle={t('glossaryResources.glossary.subtitle')}
                href="/glossary"
                cta={t('glossaryResources.glossary.cta')}
                items={glossaryItems.map((item) => ({ label: item.term, text: item.definition }))}
              />
              <ResourcePanel
                icon={Layers}
                title={t('glossaryResources.resources.title')}
                subtitle={t('glossaryResources.resources.subtitle')}
                href="/resources"
                cta={t('glossaryResources.resources.cta')}
                items={resourceItems.map((item) => ({ label: item.label, text: item.definition }))}
              />
            </div>
          </Inner>
        </Section>

        {/* ─────────────── RISK + FAQ ─────────────── */}
        <div className="border-t border-surface-200">
          {/* Risk compliance banner — full width */}
          <div className="bg-surface-950">
            <Inner className="py-14 sm:py-16 lg:py-20">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-start gap-5 sm:items-center">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold-600/30 bg-gold-400/10">
                    <AlertTriangle className="h-7 w-7 text-gold-400" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-gold-400">
                      Risk awareness
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                      {t('riskNotice.title')}
                    </h2>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.03]">
                  <div className="border-b border-white/6 p-6 sm:p-8">
                    <p className="text-base leading-7 text-surface-300">{t('riskNotice.body')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-3">
                    {[
                      { icon: Shield, text: 'Education only — no trading signals' },
                      { icon: AlertTriangle, text: 'High risk of capital loss' },
                      { icon: ShieldCheck, text: 'No fund management or advice' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-3 bg-surface-950 p-5">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400/70" />
                        <span className="text-sm leading-snug text-surface-400">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/risk-and-disclaimer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold-600/30 bg-gold-400/10 px-6 py-3 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/20"
                  >
                    {t('riskNotice.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/terms"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-surface-400 transition hover:bg-white/5 hover:text-white"
                  >
                    Terms of service
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Inner>
          </div>

          {/* FAQ knowledge center */}
          <section className="bg-white py-20 lg:py-24">
            <Inner>
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-700">
                    Knowledge center
                  </p>
                  <h2 className="text-2xl font-semibold text-text-main sm:text-3xl">
                    Common questions about Avenqor
                  </h2>
                  <p className="mt-2 max-w-xl text-base text-text-secondary">
                    Key points about what Avenqor is — and what it is not.
                  </p>
                </div>
                <Link href="/faq" className="btn-secondary shrink-0">
                  View all FAQs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <FAQAccordion searchQuery="" selectedCategory="all" />
            </Inner>
          </section>
        </div>

        {/* ─────────────────── FINAL CTA ─────────────────── */}
        <Section className="py-12 lg:py-16">
          <Inner>
            <div className="relative overflow-hidden rounded-2xl bg-surface-950 shadow-card">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(20,184,166,1) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,1) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="relative px-8 py-14 sm:px-12 sm:py-16 lg:px-16">
                <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gold-400">
                      Start carefully
                    </p>
                    <h2 className="mt-3 font-heading text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                      {t('footerCta.title')}
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-surface-300">
                      {t('footerCta.subtitle')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/courses" className="btn-primary">
                      {t('footerCta.ctaPrimary')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/learn?tab=custom"
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white px-6 py-3 text-sm font-semibold text-surface-950 transition hover:bg-brand-50"
                    >
                      {t('footerCta.ctaSecondary')}
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      <Coins className="h-4 w-4" />
                      View pricing
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Inner>
        </Section>
      </main>
    </div>
  )
}

function ResourcePanel({
  icon: Icon,
  title,
  subtitle,
  items,
  href,
  cta,
}: {
  icon: typeof BookOpen
  title: string
  subtitle: string
  items: Array<{ label: string; text: string }>
  href: string
  cta: string
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-surface-200 bg-white shadow-card">
      <div className="flex items-start gap-4 border-b border-surface-200 p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold text-text-main">{title}</h3>
          <p className="mt-1 text-sm sm:text-base text-text-secondary">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 p-6">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-surface-200 bg-surface-0 p-4">
            <p className="text-sm font-semibold text-text-main">{item.label}</p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-surface-200 px-6 py-4">
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
