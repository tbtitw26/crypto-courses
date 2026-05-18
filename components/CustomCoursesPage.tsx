'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Cpu,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ChevronRight,
  ArrowRight,
  Info,
  FolderKanban,
  XCircle,
  Loader2,
} from 'lucide-react'
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
  let classes = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium'
  let icon: React.ReactNode = null

  switch (status) {
    case 'In progress':
    case 'Processing':
      classes += ' border-blue-200 bg-blue-50 text-blue-700'
      icon = <Clock className="h-3 w-3 shrink-0" />
      break
    case 'Delivered':
    case 'Completed':
      classes += ' border-emerald-200 bg-emerald-50 text-emerald-700'
      icon = <CheckCircle2 className="h-3 w-3 shrink-0" />
      break
    case 'Awaiting review':
      classes += ' border-amber-200 bg-amber-50 text-amber-700'
      icon = <AlertTriangle className="h-3 w-3 shrink-0" />
      break
    case 'Failed':
      classes += ' border-rose-200 bg-rose-50 text-rose-700'
      icon = <XCircle className="h-3 w-3 shrink-0" />
      break
    case 'Intake draft':
      classes += ' border-surface-200 bg-surface-50 text-text-secondary'
      break
  }

  return (
    <span className={classes}>
      {icon}
      <span>{t(`status.${status.toLowerCase().replace(/\s+/g, '')}`)}</span>
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/custom-courses')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchCustomCourses() {
      if (!session?.user?.id || status !== 'authenticated') return

      try {
        setIsLoadingCourses(true)
        const response = await fetch('/api/custom-courses')

        if (response.ok) {
          const data = await response.json()
          const courses: CustomCourse[] = (data.courses || []).map((course: any) => {
            let uiStatus: CustomCourseStatus = 'In progress'
            if (course.status === 'Completed' || course.dbStatus === 'completed') {
              uiStatus = 'Delivered'
            } else if (course.dbStatus === 'ready') {
              uiStatus = 'Delivered'
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

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session?.user) {
    return null
  }

  const filteredCourses = customCourses.filter((course) => {
    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || course.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusColor = (s: CustomCourseStatus) => {
    switch (s) {
      case 'In progress':
      case 'Processing':
        return 'border-l-blue-500'
      case 'Delivered':
      case 'Completed':
        return 'border-l-emerald-500'
      case 'Awaiting review':
        return 'border-l-amber-500'
      case 'Failed':
        return 'border-l-rose-500'
      default:
        return 'border-l-surface-300'
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <DashboardNavigation />

      <div className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 text-xs text-text-muted">
              <Link href="/dashboard" className="transition hover:text-text-secondary">
                {tDashboard('breadcrumb.dashboard')}
              </Link>
              <span className="text-text-muted/50"> / </span>
              <span className="text-text-secondary">{t('title')}</span>
            </div>
            <h1 className="text-xl font-semibold text-text-main sm:text-2xl">{t('heading')}</h1>
            <p className="mt-1 max-w-lg text-sm sm:text-base text-text-secondary">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/learn?tab=ai"
              className="inline-flex items-center gap-1 text-xs text-text-muted transition hover:text-brand-600"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>{t('switchToAIStrategy')}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
            <Link
              href="/learn?tab=custom"
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t('requestNewCourse')}</span>
            </Link>
          </div>
        </div>

        {/* Search + Status filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="input-field w-full rounded-lg py-2 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="mr-1 text-text-muted">{t('filters.status')}:</span>
            {(['All', 'In progress', 'Delivered', 'Failed'] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-full border px-2.5 py-1 transition ${
                  statusFilter === f
                    ? 'border-brand-600 bg-brand-600 font-medium text-white'
                    : 'border-surface-200 bg-white text-text-secondary hover:border-surface-300'
                }`}
              >
                {t(`filters.statusOptions.${f.toLowerCase().replace(/\s+/g, '')}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Pipeline cards */}
          <div className="lg:col-span-2 space-y-3">
            <div className="mb-1 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-text-main">{t('requests.title')}</h2>
              <span className="text-xs text-text-muted">{t('requests.subtitle')}</span>
            </div>

            {isLoadingCourses ? (
              <div className="flex items-center justify-center rounded-xl border border-surface-200 bg-white py-16 shadow-card">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="space-y-3">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`rounded-xl border border-surface-200 border-l-4 bg-white p-4 shadow-card ${statusColor(course.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md border border-surface-200 bg-surface-50">
                        {course.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.coverUrl}
                            alt={`${course.title} cover`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FileText className="h-4 w-4 text-text-muted" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-text-main">{course.title}</h3>
                          <StatusBadge status={course.status} t={t} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span>{course.market} · {course.level}</span>
                          <span>ID: {course.id}</span>
                          <span>Created {course.created}</span>
                          {course.eta && <span>ETA {course.eta}</span>}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {course.status === 'Delivered' && course.pdfUrl ? (
                          <a
                            href={course.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                          >
                            <span>{t('actions.downloadPDF')}</span>
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        ) : course.status === 'Delivered' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{t('actions.pdfPending')}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-surface-200 bg-white p-10 text-center shadow-card">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-main">{t('emptyState.title')}</h3>
                <p className="mt-1 text-xs text-text-muted">{t('emptyState.description')}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('sidebar.intakeForm.title')}</h3>
              </div>
              <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
                <li>• {t('sidebar.intakeForm.experience')}</li>
                <li>• {t('sidebar.intakeForm.deposit')}</li>
                <li>• {t('sidebar.intakeForm.market')}</li>
                <li>• {t('sidebar.intakeForm.style')}</li>
                <li>• {t('sidebar.intakeForm.goals')}</li>
              </ul>
              <p className="mt-2 text-xs text-text-muted">{t('sidebar.intakeForm.note')}</p>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('sidebar.emptyState.title')}</h3>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{t('sidebar.emptyState.description')}</p>
              <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-text-muted" />
                  <span className="text-xs font-semibold text-text-main">{t('sidebar.emptyState.noCourses')}</span>
                </div>
                <p className="mb-3 text-xs text-text-muted">{t('sidebar.emptyState.hint')}</p>
                <Link
                  href="/learn?tab=custom"
                  className="btn-primary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                >
                  <PlusCircle className="h-3 w-3" />
                  <span>{t('sidebar.emptyState.requestFirstCourse')}</span>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" />
                <h3 className="text-xs font-semibold text-text-main">{t('deliveryInfo.title')}</h3>
              </div>
              <p className="text-xs leading-relaxed text-text-muted">{t('deliveryInfo.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
