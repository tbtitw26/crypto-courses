// components/CustomCoursesPage.tsx - Custom courses page component for dashboard

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  Cpu,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PlusCircle,
  ChevronRight,
  ArrowRight,
  Info,
  FolderKanban,
  XCircle,
} from 'lucide-react'
import { HomeSection } from './HomeSection'
import { DashboardNavigation } from './DashboardNavigation'

type CustomCourseStatus =
  | 'Intake draft'
  | 'Awaiting review'
  | 'In progress'
  | 'Delivered'
  | 'Failed'
  | 'Processing'
  | 'Completed'

interface CustomCourse {
  id: string
  title: string
  market: string
  level: string
  status: CustomCourseStatus
  created: string
  eta?: string
  pdfUrl?: string
  coverUrl?: string | null
  assetsStatus?: string | null
}

function StatusBadge({ status, t }: { status: CustomCourseStatus; t: any }) {
  let classes =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] w-fit whitespace-nowrap'
  let icon: React.ReactNode = null

  switch (status) {
    case 'In progress':
    case 'Processing':
      classes += ' border-cyan-500/60 text-cyan-200'
      icon = <Clock className="w-3 h-3 flex-shrink-0" />
      break
    case 'Delivered':
    case 'Completed':
      classes += ' border-emerald-500/70 text-emerald-200'
      icon = <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
      break
    case 'Awaiting review':
      classes += ' border-amber-500/70 text-amber-200'
      icon = <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      break
    case 'Failed':
      classes += ' border-rose-500/70 text-rose-200'
      icon = <XCircle className="w-3 h-3 flex-shrink-0" />
      break
    case 'Intake draft':
      classes += ' border-slate-700 text-slate-300'
      break
  }

  return (
    <span className={classes}>
      {icon}
      <span className="whitespace-nowrap">{t(`status.${status.toLowerCase().replace(/\s+/g, '')}`)}</span>
    </span>
  )
}

export function CustomCoursesPage() {
  const t = useTranslations('dashboard.customCoursesPage')
  const tDashboard = useTranslations('dashboard')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Intake draft' | 'Awaiting review' | 'In progress' | 'Delivered' | 'Failed'
  >('All')
  const [customCourses, setCustomCourses] = useState<CustomCourse[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/custom-courses')
    }
  }, [status, router])

  // Load custom courses from API
  useEffect(() => {
    async function fetchCustomCourses() {
      if (!session?.user?.id || status !== 'authenticated') return

      try {
        setIsLoadingCourses(true)
        const response = await fetch('/api/custom-courses')
        
        if (response.ok) {
          const data = await response.json()
          const courses: CustomCourse[] = (data.courses || []).map((course: any) => {
            // Map status from DB to UI status
            let uiStatus: CustomCourseStatus = 'In progress'
            if (course.status === 'Completed' || course.dbStatus === 'completed') {
              uiStatus = 'Delivered'
            } else if (course.dbStatus === 'ready') {
              uiStatus = 'Delivered' // Ready means PDF is generated, treat as delivered
            } else if (course.dbStatus === 'failed') {
              uiStatus = 'Failed'
            } else if (course.dbStatus === 'processing') {
              uiStatus = 'In progress'
            } else {
              uiStatus = 'In progress'
            }

            return {
              id: course.id,
              title: course.title,
              market: course.market,
              level: course.level,
              status: uiStatus,
              created: new Date(course.created).toLocaleDateString(),
              eta: course.estimatedReadyAt ? new Date(course.estimatedReadyAt).toLocaleDateString() : undefined,
              pdfUrl: course.pdfUrl,
              coverUrl: course.coverUrl,
              assetsStatus: course.assetsStatus,
            }
          })
          setCustomCourses(courses)
        } else {
          console.error('Failed to fetch custom courses')
        }
      } catch (error) {
        console.error('Error fetching custom courses:', error)
      } finally {
        setIsLoadingCourses(false)
      }
    }

    if (status === 'authenticated') {
      fetchCustomCourses()
    }
  }, [session?.user?.id, status])

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (status === 'unauthenticated' || !session?.user) {
    return null
  }

  // Filter courses based on search and status filter
  const filteredCourses = customCourses.filter((course) => {
    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || course.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.26),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <main className="pt-6">
        {/* Dashboard Navigation */}
        <DashboardNavigation />

        {/* Top bar / header */}
        <HomeSection className="pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-300 transition">
                {tDashboard('breadcrumb.dashboard')}
              </Link>
              <span className="text-slate-600"> / </span>
              <span className="text-slate-300">{t('title')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
              {t('heading')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-xl">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 text-[11px]">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 border border-slate-800 px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium">
                  {t('deliveryInfo.title')}
                </span>
                <span className="text-slate-500">{t('deliveryInfo.subtitle')}</span>
              </div>
            </div>
            <Link
              href="/learn?tab=ai"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition"
            >
              <Cpu className="w-3 h-3" />
              <span>{t('switchToAIStrategy')}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </HomeSection>

        {/* Call to action + filters */}
        <HomeSection className="pb-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/learn?tab=custom"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-cyan-400 text-slate-950 text-xs sm:text-sm font-semibold hover:bg-cyan-300 shadow-[0_14px_32px_rgba(8,145,178,0.65)] transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('requestNewCourse')}</span>
              </Link>
            </div>
            <div className="flex-1 flex items-center gap-2 md:justify-end">
              <div className="flex-1 max-w-xs flex items-center gap-2 rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-800">
              <span>{t('filters.status')}:</span>
            </div>
            {(['All', 'In progress', 'Delivered', 'Failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-full border transition ${
                  statusFilter === f
                    ? 'bg-slate-100 text-slate-950 border-slate-100'
                    : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                {t(`filters.statusOptions.${f.toLowerCase().replace(/\s+/g, '')}`)}
              </button>
            ))}
          </div>
        </HomeSection>

        {/* Current requests list */}
        <HomeSection className="pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-50">
                  {t('requests.title')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t('requests.subtitle')}
                </div>
              </div>
            </div>

            {isLoadingCourses ? (
              <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 text-center">
                <div className="text-sm text-slate-400">Loading...</div>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/80">
                <div className="grid grid-cols-12 px-4 py-2 text-[11px] text-slate-400 border-b border-slate-900">
                  <div className="col-span-3">{t('table.title')}</div>
                  <div className="col-span-2">{t('table.marketLevel')}</div>
                  <div className="col-span-3">{t('table.statusEta')}</div>
                  <div className="col-span-2">{t('table.created')}</div>
                  <div className="col-span-2 text-right">{t('table.actions')}</div>
                </div>
                <div className="divide-y divide-slate-900">
                  {filteredCourses.map((course) => (
                    <motion.div
                      key={course.id}
                      className="grid grid-cols-12 px-4 py-3 text-[11px] text-slate-200 hover:bg-slate-900/70 transition-colors"
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="col-span-3 flex flex-col gap-1 pr-2">
                        <div className="flex items-start gap-2">
                          <div className="w-10 h-14 rounded-md bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                            {course.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={course.coverUrl}
                                alt={`${course.title} cover`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full text-[10px] text-slate-500 flex items-center justify-center text-center px-1">
                                No cover
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-50 truncate block">
                              {course.title}
                            </span>
                            <span className="text-slate-500 block truncate">{course.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <span className="text-slate-100">{course.market}</span>
                        <span className="text-slate-500">{course.level}</span>
                      </div>
                      <div className="col-span-3 flex flex-col gap-1 items-start">
                        <StatusBadge status={course.status} t={t} />
                        {course.eta && (
                          <span className="text-slate-500">{course.eta}</span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center text-slate-300">
                        {course.created}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2 text-[11px]">
                        {course.status === 'Delivered' && course.pdfUrl ? (
                          <a
                            href={course.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 transition"
                          >
                            <span>{t('actions.downloadPDF')}</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        ) : course.status === 'Delivered' ? (
                          <span className="inline-flex items-center gap-1 text-slate-500 cursor-not-allowed">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{t('actions.pdfPending')}</span>
                          </span>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-100 mb-1">
                  {t('emptyState.title')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t('emptyState.description')}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: intake summary and empty state */}
          <div className="lg:col-span-4 space-y-4">
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 text-[11px] text-slate-300/90 space-y-2"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('sidebar.intakeForm.title')}
                </div>
              </div>
              <ul className="space-y-1.5">
                <li>• {t('sidebar.intakeForm.experience')}</li>
                <li>• {t('sidebar.intakeForm.deposit')}</li>
                <li>• {t('sidebar.intakeForm.market')}</li>
                <li>• {t('sidebar.intakeForm.style')}</li>
                <li>• {t('sidebar.intakeForm.goals')}</li>
              </ul>
              <p className="text-slate-400 mt-1">
                {t('sidebar.intakeForm.note')}
              </p>
            </motion.div>

            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 text-[11px] text-slate-300/90 space-y-2"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('sidebar.emptyState.title')}
                </div>
              </div>
              <p>{t('sidebar.emptyState.description')}</p>
              <div className="mt-2 rounded-xl bg-slate-950 border border-slate-900 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-300" />
                  <div className="text-xs font-semibold text-slate-100">
                    {t('sidebar.emptyState.noCourses')}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('sidebar.emptyState.hint')}
                </p>
                <Link
                  href="/learn?tab=custom"
                  className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-semibold hover:bg-cyan-300 transition"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>{t('sidebar.emptyState.requestFirstCourse')}</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </HomeSection>
      </main>
    </div>
  )
}

