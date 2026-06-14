'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Cpu,
  Download,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  Library,
  LineChart,
  PenLine,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react'
import { CourseCard } from '@/components/CourseCard'
import FAQAccordion from '@/components/FAQAccordion'
import { TokenPacks } from '@/components/TokenPacks'
import { TestimonialsVideos } from '@/components/TestimonialsVideos'
import { TradingViewWidget } from '@/components/TradingViewWidget'

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
      initial={{ opacity: 0, y: 24 }}
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

function StaggerItem({ children, index, className = '' }: { children: React.ReactNode; index: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
    >
      {children}
    </motion.div>
  )
}

const goalOptions = [
  {
    label: "I'm completely new",
    icon: GraduationCap,
    path: 'Beginner Course Library',
    desc: 'Start with structured PDF courses that cover fundamentals of Forex, Crypto or Binary options. Each module builds on the previous one.',
    products: ['Beginner PDF Courses', 'Risk Management Basics', 'Trading Journal Template'],
    cta: 'Browse beginner courses',
    href: '/courses',
  },
  {
    label: 'I understand the basics',
    icon: TrendingUp,
    path: 'Custom Course Builder',
    desc: 'Request a tailored PDF course from a professional trader. Share your experience level, deposit size and goals to receive personalised content.',
    products: ['Custom PDF Course', 'Intermediate Strategies', 'Position Sizing Guide'],
    cta: 'Request custom course',
    href: '/learn?tab=custom',
  },
  {
    label: 'I need better risk management',
    icon: Shield,
    path: 'Risk & Discipline Tools',
    desc: 'Access practical templates and educational resources focused entirely on managing risk, setting limits and building trading discipline.',
    products: ['Risk Management Checklist', 'Trade Journal', 'Weekly Review Template'],
    cta: 'Explore risk tools',
    href: '/learn/risk-management',
  },
  {
    label: 'I want a structured strategy',
    icon: BrainCircuit,
    path: 'AI Strategy Builder',
    desc: 'Generate a structured trading plan with entry/exit logic and a risk checklist. Choose your market, timeframe and risk parameters.',
    products: ['AI Strategy PDF', 'Entry/Exit Logic', 'Risk Checklist'],
    cta: 'Open AI Strategy Builder',
    href: '/learn?tab=ai',
  },
]

const roadmapSteps = [
  {
    title: 'Choose your market and skill level',
    desc: 'Select from Forex, Crypto or Binary options. Pick beginner, intermediate or advanced to match your current knowledge.',
    icon: Target,
  },
  {
    title: 'Receive a structured learning path',
    desc: 'Get a clear sequence of courses and resources tailored to your chosen market and level. No guesswork, no random content.',
    icon: Layers,
  },
  {
    title: 'Study courses and complete modules',
    desc: 'Work through structured PDF courses at your own pace. Each module covers theory, examples and practical frameworks.',
    icon: BookOpen,
  },
  {
    title: 'Generate or refine a strategy',
    desc: 'Use the AI Strategy Builder to create structured trading plans, or request a custom PDF from a professional trader.',
    icon: BrainCircuit,
  },
  {
    title: 'Track progress inside the dashboard',
    desc: 'Access purchased courses, monitor token balance, download PDFs and review all transactions from your personal dashboard.',
    icon: BarChart3,
  },
]

const bentoCapabilities = [
  {
    key: 'library',
    title: 'Course Library',
    desc: 'Structured PDF courses for Forex, Crypto and Binary options — organised by market and level.',
    icon: Library,
    size: 'large' as const,
    accent: 'brand',
  },
  {
    key: 'custom',
    title: 'Custom Course Builder',
    desc: 'Request a personalised PDF course built by a professional trader based on your goals and experience.',
    icon: PenLine,
    size: 'medium' as const,
    accent: 'brand',
  },
  {
    key: 'ai',
    title: 'AI Strategy Generator',
    desc: 'Generate structured trading plans with entry/exit logic and risk parameters in seconds.',
    icon: Cpu,
    size: 'medium' as const,
    accent: 'ai',
  },
  {
    key: 'wallet',
    title: 'Token Wallet',
    desc: 'One balance across all products. Buy packs or top up custom amounts.',
    icon: WalletCards,
    size: 'small' as const,
    accent: 'gold',
  },
  {
    key: 'dashboard',
    title: 'Personal Dashboard',
    desc: 'Downloads, receipts, generation status — everything in one place.',
    icon: Download,
    size: 'small' as const,
    accent: 'brand',
  },
  {
    key: 'progress',
    title: 'Learning Progress',
    desc: 'Track completed courses and AI strategies across all markets.',
    icon: BarChart3,
    size: 'small' as const,
    accent: 'brand',
  },
  {
    key: 'resources',
    title: 'Educational Resources',
    desc: 'Printable PDFs, checklists and templates for daily trading discipline.',
    icon: FileText,
    size: 'small' as const,
    accent: 'brand',
  },
]

export default function HomePage() {
  const t = useTranslations('home')
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState(0)
  const [configuratorTab, setConfiguratorTab] = useState<'custom' | 'ai'>('custom')
  const [selectedMarket, setSelectedMarket] = useState('Forex')
  const [selectedLevel, setSelectedLevel] = useState('Beginner')
  const [knowledgeSearch, setKnowledgeSearch] = useState('')
  const [faqCategory, setFaqCategory] = useState('all')
  const [riskExpanded, setRiskExpanded] = useState(false)
  const [courseFilter, setCourseFilter] = useState('All')

  const roadmapRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: roadmapProgress } = useScroll({
    target: roadmapRef,
    offset: ['start end', 'end start'],
  })
  const roadmapLineHeight = useTransform(roadmapProgress, [0.1, 0.85], ['0%', '100%'])

  useEffect(() => {
    async function fetchFeaturedCourses() {
      setIsLoadingCourses(true)
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const payload = await response.json()
          const courses = Array.isArray(payload) ? payload : payload?.data
          if (!Array.isArray(courses)) {
            setFeaturedCourses([])
            return
          }
          const truncateDescription = (desc: string, maxLength: number = 120): string => {
            if (!desc) return ''
            if (desc.length <= maxLength) return desc
            return `${desc.substring(0, maxLength).trim()}...`
          }
          const mapped: FeaturedCourse[] = courses.map((course: any) => ({
            level: course.level,
            market: course.market,
            title: course.title,
            desc: truncateDescription(course.description || ''),
            price_gbp: Number(course.price_gbp),
            tokens: course.tokens,
            slug: course.slug,
            cover_image: course.cover_image,
          }))
          setFeaturedCourses(mapped)
        } else {
          setFeaturedCourses([])
        }
      } catch {
        setFeaturedCourses([])
      } finally {
        setIsLoadingCourses(false)
      }
    }
    fetchFeaturedCourses()
  }, [])

  const glossaryItems = t.raw('glossaryResources.glossary.items') as Array<{
    term: string
    definition: string
  }>
  const resourceItems = t.raw('glossaryResources.resources.items') as Array<{
    label: string
    definition: string
  }>

  const filteredGlossary = glossaryItems.filter(
    (item) =>
      knowledgeSearch === '' ||
      item.term.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(knowledgeSearch.toLowerCase())
  )

  const filteredResources = resourceItems.filter(
    (item) =>
      knowledgeSearch === '' ||
      item.label.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(knowledgeSearch.toLowerCase())
  )

  const courseFilterTabs = useMemo(() => {
    const markets = new Set(featuredCourses.map(c => c.market))
    const levels = new Set(featuredCourses.map(c => c.level))
    const tabs: string[] = ['All']
    const marketOrder = ['General', 'Forex', 'Crypto', 'Binary']
    const levelOrder = ['Beginner', 'Intermediate', 'Advanced']
    marketOrder.forEach(m => { if (markets.has(m)) tabs.push(m) })
    levelOrder.forEach(l => { if (levels.has(l)) tabs.push(l) })
    return tabs
  }, [featuredCourses])

  const filteredCourses = featuredCourses.filter((course) => {
    if (courseFilter === 'All') return true
    return course.level === courseFilter || course.market === courseFilter
  })

  const currentGoal = goalOptions[selectedGoal]

  return (
    <div className="relative overflow-x-hidden">
      <main className="relative z-10">
        {/* ═══════════════════ SPLIT HERO ═══════════════════ */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-50/40 via-white to-surface-0" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,125,122,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,125,122,0.5) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
              }}
            />
            <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-brand-200/20 blur-[120px]" />
            <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-ai/5 blur-[100px]" />
          </div>

          <Inner className="relative pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
              {/* Left — Editorial */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/60 px-4 py-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                    {t('hero.badgeRight')}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-heading text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-text-main sm:text-5xl lg:text-[3.5rem]"
                >
                  <span className="text-gradient-brand">{t('hero.title').split('.')[0]}.</span>
                  <br className="hidden sm:block" />
                  <span className="text-text-main">
                    {t('hero.title').split('.').slice(1).join('.').trim()}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-6 max-w-lg text-lg leading-8 text-text-secondary"
                >
                  {t('hero.subtitle')}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-8 flex items-center gap-4"
                >
                  <Link href="/courses" className="btn-primary">
                    {t('hero.ctaPrimaryLabel')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/learn"
                    className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                  >
                    {t('hero.ctaSecondaryLabel')} &rarr;
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-surface-200 pt-6"
                >
                  {[
                    { value: '3', label: 'Markets', icon: Globe },
                    { value: 'PDF', label: 'Courses', icon: FileText },
                    { value: 'AI', label: 'Strategies', icon: Sparkles },
                    { value: '4', label: 'Currencies', icon: Coins },
                  ].map(({ value, label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand-600" />
                      <span className="text-sm font-semibold text-text-main">{value}</span>
                      <span className="text-sm text-text-muted">{label}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right — Product Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl border border-surface-200 bg-white p-1 shadow-card">
                  <div className="rounded-xl bg-surface-950 p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-brand-400" />
                        <span className="text-xs font-semibold text-surface-300">
                          Learning Dashboard
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-surface-600" />
                        <div className="h-2 w-2 rounded-full bg-surface-600" />
                        <div className="h-2 w-2 rounded-full bg-surface-600" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border border-white/8 bg-white/5 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-surface-400">Course Progress</span>
                          <span className="text-xs font-bold text-brand-400">67%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                            initial={{ width: '0%' }}
                            animate={{ width: '67%' }}
                            transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-white/8 bg-white/5 p-3">
                          <FileText className="mb-2 h-4 w-4 text-brand-400" />
                          <p className="text-xs font-medium text-white">Forex Foundations</p>
                          <p className="mt-0.5 text-[10px] text-surface-500">Beginner · 12 modules</p>
                        </div>
                        <div className="rounded-lg border border-white/8 bg-white/5 p-3">
                          <BrainCircuit className="mb-2 h-4 w-4 text-ai" />
                          <p className="text-xs font-medium text-white">AI Strategy</p>
                          <p className="mt-0.5 text-[10px] text-surface-500">Generated · Ready</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/8 bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-gold-400" />
                            <span className="text-xs font-medium text-white">Token Balance</span>
                          </div>
                          <span className="text-sm font-bold text-gold-400">4,200</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating cards */}
                <motion.div
                  className="absolute -left-6 top-12 z-10 rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-card sm:-left-10"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    <span className="text-xs font-semibold text-text-main">{t('hero.badgeLeft')}</span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -right-4 bottom-16 z-10 rounded-xl border border-surface-200 bg-white px-3 py-2 shadow-card sm:-right-8"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-ai" />
                    <span className="text-xs font-semibold text-text-main">AI-Powered</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </Inner>
        </div>

        {/* ═══════════════════ SOCIAL PROOF STRIP ═══════════════════ */}
        <div className="border-y border-surface-200 bg-white">
          <Inner className="py-8 lg:py-10">
            <div className="flex flex-wrap items-center justify-between gap-6 lg:gap-10">
              {[
                { value: 'Forex · Crypto · Binary', label: 'Markets covered' },
                { value: 'PDF + Custom', label: 'Course formats' },
                { value: 'AI-Generated', label: 'Strategy documents' },
                { value: 'Token-Based', label: 'Flexible access' },
              ].map(({ value, label }, i) => (
                <StaggerItem key={label} index={i} className="flex-1 min-w-[140px]">
                  <p className="font-heading text-lg font-semibold text-text-main sm:text-xl">
                    {value}
                  </p>
                  <p className="mt-0.5 text-sm text-text-muted">{label}</p>
                </StaggerItem>
              ))}
            </div>
            <p className="mt-6 text-xs text-text-muted">
              {t('marketSnapshot.disclaimer')}
            </p>
          </Inner>
        </div>

        {/* ═══════════════════ GOAL-BASED LEARNING SELECTOR ═══════════════════ */}
        <Section className="py-20 lg:py-28">
          <Inner>
            <div className="mb-12 max-w-2xl">
              <div className="badge-brand mb-4">
                <Target className="h-3.5 w-3.5" />
                Choose your path
              </div>
              <h2 className="section-heading">{t('paths.title')}</h2>
              <p className="section-subheading mt-4">{t('paths.subtitle')}</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:gap-12">
              {/* Left — Selectable goals */}
              <div className="space-y-3">
                {goalOptions.map((goal, i) => {
                  const Icon = goal.icon
                  const isActive = selectedGoal === i
                  return (
                    <button
                      key={goal.label}
                      type="button"
                      onClick={() => setSelectedGoal(i)}
                      className={`group flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-200 ${
                        isActive
                          ? 'border-2 border-brand-500 bg-brand-50/60 shadow-brand-glow'
                          : 'border border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm'
                      }`}
                      aria-pressed={isActive}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-100 text-text-muted group-hover:bg-surface-200'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isActive ? 'text-brand-800' : 'text-text-main'
                        }`}
                      >
                        {goal.label}
                      </span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-4 w-4 text-brand-600" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Right — Dynamic preview */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedGoal}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-surface-200 bg-white p-8 shadow-card"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-700">
                    Recommended path
                  </p>
                  <h3 className="font-heading text-xl font-semibold text-text-main sm:text-2xl">
                    {currentGoal.path}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-text-secondary">
                    {currentGoal.desc}
                  </p>

                  <div className="mt-6 space-y-2">
                    {currentGoal.products.map((product) => (
                      <div
                        key={product}
                        className="flex items-center gap-3 rounded-lg bg-surface-0 px-4 py-2.5"
                      >
                        <Check className="h-4 w-4 shrink-0 text-brand-600" />
                        <span className="text-sm text-text-main">{product}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={currentGoal.href} className="btn-primary mt-8">
                    {currentGoal.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </Inner>
        </Section>

        {/* ═══════════════════ LEARNING ROADMAP ═══════════════════ */}
        <div className="bg-surface-950 text-white">
          <Section className="py-20 lg:py-28">
            <Inner>
              <div className="mb-16 max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-400">
                  Learning roadmap
                </p>
                <h2 className="font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  {t('howItWorks.title')}
                </h2>
                <p className="mt-4 text-base leading-7 text-surface-400">
                  {t('howItWorks.subtitle')}
                </p>
              </div>

              <div ref={roadmapRef} className="relative">
                {/* Progress line */}
                <div className="absolute left-6 top-0 hidden h-full w-px bg-white/10 lg:block">
                  <motion.div
                    className="w-full bg-gradient-to-b from-brand-400 to-brand-600"
                    style={{ height: roadmapLineHeight }}
                  />
                </div>

                <div className="space-y-8 lg:space-y-12">
                  {roadmapSteps.map((step, i) => {
                    const Icon = step.icon
                    const isEven = i % 2 === 0
                    return (
                      <StaggerItem key={step.title} index={i}>
                        <div
                          className={`flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10 ${
                            !isEven ? 'lg:flex-row-reverse lg:text-right' : ''
                          }`}
                        >
                          {/* Step marker */}
                          <div className="relative flex shrink-0 items-center gap-4 lg:w-12 lg:flex-col lg:items-center lg:gap-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                              <Icon className="h-5 w-5 text-brand-400" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className={`max-w-lg ${!isEven ? 'lg:ml-auto' : ''}`}>
                            <div className="mb-2 flex items-center gap-3">
                              <span className="font-heading text-sm font-bold text-brand-400">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <h3 className="font-heading text-lg font-semibold text-white">
                              {step.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-surface-400">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </StaggerItem>
                    )
                  })}
                </div>
              </div>
            </Inner>
          </Section>
        </div>

        {/* ═══════════════════ PLATFORM BENTO GRID ═══════════════════ */}
        <Section className="py-20 lg:py-28">
          <Inner>
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-700">
                The platform
              </p>
              <h2 className="section-heading">
                A connected education system, not a content dump.
              </h2>
              <p className="section-subheading mt-4">
                Every product feeds into a single dashboard. Courses, custom PDFs, AI strategies, tokens and receipts — all in one place.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto]">
              {/* Large — Course Library */}
              <StaggerItem
                index={0}
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-8 shadow-card transition-shadow hover:shadow-card-hover sm:col-span-2 lg:row-span-2"
              >
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-50 blur-[60px]" />
                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Library className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-text-main">
                    {bentoCapabilities[0].title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-text-secondary">
                    {bentoCapabilities[0].desc}
                  </p>
                  <div className="mt-6 grid gap-2">
                    {['Forex', 'Crypto', 'Binary'].map((market) => (
                      <div
                        key={market}
                        className="flex items-center gap-2 rounded-lg bg-surface-0 px-3 py-2 text-sm text-text-secondary"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        {market} courses by level
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/courses"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                  >
                    Browse library <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </StaggerItem>

              {/* Medium cards */}
              {bentoCapabilities.slice(1, 3).map((cap, i) => {
                const Icon = cap.icon
                return (
                  <StaggerItem
                    key={cap.key}
                    index={i + 1}
                    className={`group rounded-2xl p-6 transition-shadow hover:shadow-card-hover ${
                      cap.accent === 'ai'
                        ? 'border border-surface-700 bg-surface-950 text-white'
                        : 'border border-surface-200 bg-white'
                    }`}
                  >
                    <div
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                        cap.accent === 'ai'
                          ? 'border border-white/10 bg-white/8 text-ai'
                          : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3
                      className={`font-heading text-base font-semibold ${
                        cap.accent === 'ai' ? 'text-white' : 'text-text-main'
                      }`}
                    >
                      {cap.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${
                        cap.accent === 'ai' ? 'text-surface-400' : 'text-text-secondary'
                      }`}
                    >
                      {cap.desc}
                    </p>
                  </StaggerItem>
                )
              })}

              {/* Small cards */}
              {bentoCapabilities.slice(3).map((cap, i) => {
                const Icon = cap.icon
                return (
                  <StaggerItem
                    key={cap.key}
                    index={i + 3}
                    className="group flex items-start gap-4 rounded-2xl border border-surface-200 bg-white p-5 transition-shadow hover:shadow-sm"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        cap.accent === 'gold'
                          ? 'bg-gold-50 text-gold-600'
                          : 'bg-surface-100 text-brand-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-main">{cap.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{cap.desc}</p>
                    </div>
                  </StaggerItem>
                )
              })}
            </div>
          </Inner>
        </Section>

        {/* ═══════════════════ EDITORIAL COURSE LIBRARY ═══════════════════ */}
        <div className="bg-white">
          <Section className="border-y border-surface-200 py-20 lg:py-28">
            <Inner>
              <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
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

              {/* Filter tabs */}
              <div className="mb-8 flex flex-wrap gap-2">
                {courseFilterTabs.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCourseFilter(filter)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      courseFilter === filter
                        ? 'bg-surface-900 text-white shadow-sm'
                        : 'bg-surface-100 text-text-secondary hover:bg-surface-200 hover:text-text-main'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Course grid — editorial layout */}
              {isLoadingCourses ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-surface-200 bg-white p-5">
                      <div className="skeleton aspect-[16/9]" />
                      <div className="mt-5 h-4 w-3/4 rounded bg-surface-200" />
                      <div className="mt-4 h-3 w-full rounded bg-surface-200" />
                      <div className="mt-2 h-3 w-5/6 rounded bg-surface-200" />
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.slice(0, 6).map((course, i) => (
                    <StaggerItem key={course.slug} index={i} className={i === 0 ? 'md:col-span-2 lg:col-span-1' : ''}>
                      <CourseCard course={course} />
                    </StaggerItem>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center text-sm text-text-muted">
                  No courses match the selected filter.
                </div>
              )}
            </Inner>
          </Section>
        </div>

        {/* ═══════════════════ CUSTOM COURSE / AI STRATEGY CONFIGURATOR ═══════════════════ */}
        <Section className="py-20 lg:py-28">
          <Inner>
            <div className="mb-12 max-w-2xl">
              <div className="badge-brand mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Product configurator
              </div>
              <h2 className="section-heading">{t('howItWorks.title')}</h2>
              <p className="section-subheading mt-3">{t('howItWorks.subtitle')}</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.4fr_0.6fr] lg:gap-12">
              {/* Left — Controls */}
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex rounded-xl bg-surface-100 p-1">
                  <button
                    type="button"
                    onClick={() => setConfiguratorTab('custom')}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      configuratorTab === 'custom'
                        ? 'bg-white text-text-main shadow-sm'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    Custom Course
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfiguratorTab('ai')}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                      configuratorTab === 'ai'
                        ? 'bg-white text-text-main shadow-sm'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    AI Strategy
                  </button>
                </div>

                {/* Selectors */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Market
                    </label>
                    <div className="flex gap-2">
                      {['Forex', 'Crypto', 'Binary'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelectedMarket(m)}
                          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                            selectedMarket === m
                              ? 'border-2 border-brand-500 bg-brand-50 text-brand-800'
                              : 'border border-surface-200 bg-white text-text-secondary hover:border-surface-300'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Level
                    </label>
                    <div className="flex gap-2">
                      {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setSelectedLevel(l)}
                          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                            selectedLevel === l
                              ? 'border-2 border-brand-500 bg-brand-50 text-brand-800'
                              : 'border border-surface-200 bg-white text-text-secondary hover:border-surface-300'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href={configuratorTab === 'custom' ? '/learn?tab=custom' : '/learn?tab=ai'}
                  className="btn-primary w-full justify-center"
                >
                  {configuratorTab === 'custom' ? 'Request custom course' : 'Build AI strategy'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right — Live preview */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${configuratorTab}-${selectedMarket}-${selectedLevel}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className={`overflow-hidden rounded-2xl border p-6 sm:p-8 ${
                    configuratorTab === 'ai'
                      ? 'border-surface-700 bg-surface-950'
                      : 'border-surface-200 bg-white'
                  }`}
                >
                  {/* Preview header */}
                  <div className="mb-6 flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        configuratorTab === 'ai'
                          ? 'border border-white/10 bg-white/8 text-brand-300'
                          : 'border border-brand-200 bg-brand-50 text-brand-700'
                      }`}
                    >
                      {configuratorTab === 'ai' ? (
                        <BrainCircuit className="h-5 w-5" />
                      ) : (
                        <PenLine className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <h3
                        className={`font-heading text-base font-semibold ${
                          configuratorTab === 'ai' ? 'text-white' : 'text-text-main'
                        }`}
                      >
                        {configuratorTab === 'ai' ? 'AI Strategy Document' : 'Custom Course PDF'}
                      </h3>
                      <p
                        className={`text-sm ${
                          configuratorTab === 'ai' ? 'text-surface-400' : 'text-text-secondary'
                        }`}
                      >
                        {configuratorTab === 'ai' ? 'Generated in seconds' : 'Built by a professional trader'}
                      </p>
                    </div>
                  </div>

                  {/* Preview document mock */}
                  <div
                    className={`rounded-xl border p-5 ${
                      configuratorTab === 'ai'
                        ? 'border-white/10 bg-white/5'
                        : 'border-surface-200 bg-surface-0'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            configuratorTab === 'ai' ? 'bg-brand-400' : 'bg-brand-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            configuratorTab === 'ai' ? 'text-surface-300' : 'text-text-muted'
                          }`}
                        >
                          {selectedMarket} · {selectedLevel}
                        </span>
                      </div>
                      <div
                        className={`h-3 w-3/4 rounded ${
                          configuratorTab === 'ai' ? 'bg-white/10' : 'bg-surface-200'
                        }`}
                      />
                      <div
                        className={`h-3 w-full rounded ${
                          configuratorTab === 'ai' ? 'bg-white/8' : 'bg-surface-150'
                        }`}
                      />
                      <div
                        className={`h-3 w-5/6 rounded ${
                          configuratorTab === 'ai' ? 'bg-white/8' : 'bg-surface-150'
                        }`}
                      />
                      <div className="pt-2">
                        <div
                          className={`h-3 w-1/2 rounded ${
                            configuratorTab === 'ai' ? 'bg-white/10' : 'bg-surface-200'
                          }`}
                        />
                      </div>
                      <div
                        className={`h-3 w-full rounded ${
                          configuratorTab === 'ai' ? 'bg-white/8' : 'bg-surface-150'
                        }`}
                      />
                      <div
                        className={`h-3 w-2/3 rounded ${
                          configuratorTab === 'ai' ? 'bg-white/8' : 'bg-surface-150'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Output tags */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(configuratorTab === 'ai'
                      ? ['Strategy PDF', 'Entry/exit logic', 'Risk checklist']
                      : ['Structured PDF course', 'Custom modules', 'Email delivery']
                    ).map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          configuratorTab === 'ai'
                            ? 'border-brand-500/20 bg-brand-500/10 text-brand-300'
                            : 'border-brand-200 bg-brand-50 text-brand-800'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Inner>
        </Section>

        {/* ═══════════════════ LEARNING DASHBOARD PREVIEW ═══════════════════ */}
        <div className="border-y border-surface-200 bg-surface-0">
          <Section className="py-20 lg:py-28">
            <Inner>
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <div className="badge-neutral mb-4">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Dashboard
                  </div>
                  <h2 className="font-heading text-3xl font-semibold leading-tight text-text-main sm:text-4xl">
                    Everything in one place.
                  </h2>
                  <p className="mt-4 text-base leading-7 text-text-secondary">
                    Access purchased courses, track token balance, download PDFs, monitor AI strategy generation status, and review all transactions from your personal dashboard.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Download, label: 'PDF Downloads' },
                      { icon: Coins, label: 'Token Balance' },
                      { icon: FileText, label: 'Transaction History' },
                      { icon: BrainCircuit, label: 'AI Generation Status' },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3"
                      >
                        <Icon className="h-4 w-4 text-brand-600" />
                        <span className="text-sm font-medium text-text-main">{label}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                  >
                    Go to dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Dashboard mock */}
                <div className="rounded-2xl border border-surface-200 bg-white p-1 shadow-card">
                  <div className="rounded-xl bg-surface-950 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-brand-400" />
                      <span className="text-xs font-semibold text-surface-400">
                        Personal Dashboard
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Courses', value: '3', color: 'text-brand-400' },
                        { label: 'Strategies', value: '2', color: 'text-ai' },
                        { label: 'Tokens', value: '4.2k', color: 'text-gold-400' },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          className="rounded-lg border border-white/8 bg-white/5 p-3 text-center"
                        >
                          <p className={`font-heading text-lg font-bold ${color}`}>{value}</p>
                          <p className="text-[10px] text-surface-500">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2">
                      {['Forex Foundations', 'Crypto Volatility'].map((name) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-lg border border-white/8 bg-white/5 px-3 py-2"
                        >
                          <span className="text-xs text-surface-300">{name}</span>
                          <span className="rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                            PDF Ready
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Inner>
          </Section>
        </div>

        {/* ═══════════════════ TOKEN CALCULATOR & PRICING ═══════════════════ */}
        <div className="bg-surface-950 text-white">
          <Section className="py-20 lg:py-24">
            <Inner>
              <div className="mb-12 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
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

                <div className="space-y-3">
                  {(
                    t.raw('tokensTeaser.items') as Array<{ title: string; text: string }>
                  ).map((item, index) => {
                    const icons = [Coins, WalletCards, FileText]
                    const Icon = icons[index]
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-surface-400">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Inner>
          </Section>
        </div>

        {/* Token packs */}
        <div className="pt-20">
          <TokenPacks />
        </div>

        {/* ═══════════════════ MARKET EDUCATION LAB ═══════════════════ */}
        <Section className="py-20 lg:py-28">
          <Inner>
            <div className="mb-10 max-w-2xl">
              <div className="badge-neutral mb-4">
                <LineChart className="h-3.5 w-3.5" />
                Market education lab
              </div>
              <h2 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">
                {t('marketSnapshot.title')}
              </h2>
              <p className="mt-3 text-base leading-7 text-text-secondary">
                {t('marketSnapshot.subtitle')}
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
              <div className="rounded-2xl border border-surface-200 bg-surface-950 p-3 shadow-card">
                <TradingViewWidget />
              </div>
              <div className="space-y-5 lg:sticky lg:top-24">
                <div className="rounded-xl border border-surface-200 bg-white p-6">
                  <h3 className="mb-3 font-heading text-base font-semibold text-text-main">
                    Educational context
                  </h3>
                  <div className="space-y-3">
                    {[
                      { term: 'Volatility', desc: 'How much price moves over a given period' },
                      { term: 'Risk', desc: 'Potential for capital loss in any position' },
                      { term: 'Trend', desc: 'The general direction of price movement' },
                    ].map(({ term, desc }) => (
                      <div key={term}>
                        <p className="text-sm font-semibold text-text-main">{term}</p>
                        <p className="text-sm text-text-secondary">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
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

        {/* ═══════════════════ STUDENT STORIES ═══════════════════ */}
        <section className="border-y border-surface-200 bg-white py-20 lg:py-24">
          <Inner>
            <TestimonialsVideos />
          </Inner>
        </section>

        {/* ═══════════════════ KNOWLEDGE HUB ═══════════════════ */}
        <Section className="py-20 lg:py-28">
          <Inner>
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-700">
                Knowledge hub
              </p>
              <h2 className="section-heading">
                Glossary, resources and learning materials.
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-8 max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={knowledgeSearch}
                onChange={(e) => setKnowledgeSearch(e.target.value)}
                placeholder="Search terms and resources..."
                className="input-field pl-11"
                aria-label="Search knowledge hub"
              />
            </div>

            {/* Popular terms */}
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">
                Popular terms
              </p>
              <div className="flex flex-wrap gap-2">
                {glossaryItems.map((item) => (
                  <button
                    key={item.term}
                    type="button"
                    onClick={() => setKnowledgeSearch(item.term)}
                    className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {item.term}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Glossary */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-brand-700" />
                  <h3 className="font-heading text-lg font-semibold text-text-main">
                    {t('glossaryResources.glossary.title')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredGlossary.map((item) => (
                    <div
                      key={item.term}
                      className="rounded-xl border border-surface-200 bg-white p-4 transition hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-text-main">{item.term}</p>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {item.definition}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/glossary"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  {t('glossaryResources.glossary.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Resources */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <Layers className="h-5 w-5 text-brand-700" />
                  <h3 className="font-heading text-lg font-semibold text-text-main">
                    {t('glossaryResources.resources.title')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredResources.map((item) => (
                    <div
                      key={item.label}
                      className="group flex items-start gap-3 rounded-xl border border-surface-200 bg-white p-4 transition hover:shadow-sm"
                    >
                      <Download className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <div>
                        <p className="text-sm font-semibold text-text-main">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">
                          {item.definition}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/resources"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  {t('glossaryResources.resources.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Inner>
        </Section>

        {/* ═══════════════════ FAQ ═══════════════════ */}
        <div className="bg-white">
          <Section className="border-t border-surface-200 py-20 lg:py-28">
            <Inner>
              <div className="grid gap-10 lg:grid-cols-[0.35fr_0.65fr] lg:gap-16">
                {/* Left — sticky header + categories */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-700">
                    Knowledge center
                  </p>
                  <h2 className="text-2xl font-semibold text-text-main sm:text-3xl">
                    Common questions about the platform
                  </h2>
                  <p className="mt-3 text-base text-text-secondary">
                    Key points about what the platform is — and what it is not.
                  </p>

                  <div className="mt-6 space-y-1.5">
                    {[
                      { key: 'all', label: 'All questions' },
                      { key: 'general', label: 'General' },
                      { key: 'payments', label: 'Payments' },
                      { key: 'account', label: 'Account' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setFaqCategory(cat.key)}
                        className={`block w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-all ${
                          faqCategory === cat.key
                            ? 'bg-brand-50 text-brand-800'
                            : 'text-text-secondary hover:bg-surface-100 hover:text-text-main'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <Link href="/faq" className="btn-secondary mt-6">
                    View all FAQs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Right — accordion */}
                <div>
                  <FAQAccordion searchQuery="" selectedCategory={faqCategory} />
                </div>
              </div>
            </Inner>
          </Section>
        </div>

        {/* ═══════════════════ COMPACT RISK WARNING ═══════════════════ */}
        <div className="border-y border-surface-200 bg-surface-950">
          <Inner className="py-10 lg:py-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex shrink-0 items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-600/30 bg-gold-400/10">
                  <AlertTriangle className="h-5 w-5 text-gold-400" />
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-gold-400">
                  Risk awareness
                </p>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {t('riskNotice.title')}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed text-surface-400 ${riskExpanded ? '' : 'line-clamp-2'}`}>
                  {t('riskNotice.body')}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRiskExpanded((v) => !v)}
                    className="text-sm font-medium text-surface-300 transition hover:text-white"
                  >
                    {riskExpanded ? 'Show less' : 'Read full warning'}
                  </button>
                  <span className="text-surface-600">·</span>
                  <Link
                    href="/risk-and-disclaimer"
                    className="text-sm font-medium text-gold-400 transition hover:text-gold-300"
                  >
                    {t('riskNotice.cta')}
                  </Link>
                  <span className="text-surface-600">·</span>
                  <Link
                    href="/terms"
                    className="text-sm font-medium text-surface-400 transition hover:text-white"
                  >
                    Terms of service
                  </Link>
                </div>
              </div>
            </div>
          </Inner>
        </div>

        {/* ═══════════════════ FINAL CTA ═══════════════════ */}
        <Section className="py-16 lg:py-24">
          <Inner>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(20,184,166,0.8) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-brand-600/10 blur-[100px]" />

              <div className="relative grid gap-10 px-8 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-16">
                {/* Left — Message */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-400">
                    Start carefully
                  </p>
                  <h2 className="mt-3 font-heading text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                    {t('footerCta.title')}
                  </h2>
                  <p className="mt-4 max-w-lg text-base leading-7 text-surface-300">
                    {t('footerCta.subtitle')}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link href="/courses" className="btn-primary">
                      {t('footerCta.ctaPrimary')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/learn?tab=custom"
                      className="text-sm font-semibold text-surface-300 transition hover:text-white"
                    >
                      {t('footerCta.ctaSecondary')} &rarr;
                    </Link>
                  </div>
                </div>

                {/* Right — Visual */}
                <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-5 lg:block">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-brand-400" />
                    <span className="text-xs font-semibold text-surface-400">
                      Your learning path
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { step: '01', label: 'Choose market', done: true },
                      { step: '02', label: 'Study courses', done: true },
                      { step: '03', label: 'Build strategy', done: false },
                      { step: '04', label: 'Track progress', done: false },
                    ].map(({ step, label, done }) => (
                      <div
                        key={step}
                        className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/5 px-4 py-2.5"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                            done
                              ? 'bg-brand-500/20 text-brand-400'
                              : 'bg-white/5 text-surface-500'
                          }`}
                        >
                          {done ? <Check className="h-3 w-3" /> : step}
                        </span>
                        <span
                          className={`text-sm ${
                            done ? 'text-surface-300' : 'text-surface-500'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
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
