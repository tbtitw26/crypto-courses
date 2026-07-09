'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Mail,
  Globe2,
  Languages,
  Bell,
  ShieldCheck,
  Lock,
  KeyRound,
  Trash2,
  Download,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  X,
  Save,
  Loader2,
} from 'lucide-react'
import { DashboardNavigation } from './DashboardNavigation'
import { ChangePasswordModal } from './ChangePasswordModal'
import { currencies } from '@/lib/currency-config'
import { useToast } from '@/hooks/use-toast'

function Toggle({
  label,
  description,
  defaultOn = false,
  required = false,
  onChange,
}: {
  label: string
  description?: string
  defaultOn?: boolean
  required?: boolean
  onChange?: (checked: boolean) => void
}) {
  const [isOn, setIsOn] = useState(defaultOn)

  const handleToggle = () => {
    const newValue = !isOn
    setIsOn(newValue)
    onChange?.(newValue)
  }

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={handleToggle}
        className={`mt-0.5 inline-flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors ${
          isOn
            ? 'justify-end border-brand-500 bg-brand-500'
            : 'justify-start border-surface-300 bg-surface-200'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full transition-colors ${
            isOn ? 'bg-white' : 'bg-surface-400'
          }`}
        />
      </button>
      <div className="text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-text-main">{label}</span>
          {required && (
            <span className="rounded-full border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] text-text-muted">
              Required
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-text-muted">{description}</p>
        )}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const t = useTranslations('dashboard.settingsPage')
  const tDashboard = useTranslations('dashboard')
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [courseLanguage, setCourseLanguage] = useState('english')
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileData, setProfileData] = useState<{
    firstName: string
    lastName: string | null
    email: string
    citizenship: string | null
  } | null>(null)
  const [editedFirstName, setEditedFirstName] = useState('')
  const [editedLastName, setEditedLastName] = useState('')
  const [editedRegion, setEditedRegion] = useState('')

  const loadProfileData = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoadingProfile(true)
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to load profile data')
      }
      const data = await response.json()
      if (data.success && data.user) {
        setProfileData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          citizenship: data.user.citizenship,
        })
        setEditedFirstName(data.user.firstName)
        setEditedLastName(data.user.lastName || '')
        setEditedRegion(data.user.citizenship || '')
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      showToast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'error',
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }, [session?.user?.id, showToast])

  useEffect(() => {
    if (session?.user?.id && !profileData) {
      void loadProfileData()
    }
  }, [session?.user?.id, profileData, loadProfileData])

  const handleEditProfile = () => {
    if (!profileData) {
      void loadProfileData()
    }
    setIsEditingProfile(true)
  }

  const handleCancelEdit = () => {
    if (profileData) {
      setEditedFirstName(profileData.firstName)
      setEditedLastName(profileData.lastName || '')
      setEditedRegion(profileData.citizenship || '')
    }
    setIsEditingProfile(false)
  }

  const handleSaveProfile = async () => {
    if (!profileData) return

    if (!editedFirstName.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'First name is required',
        variant: 'error',
      })
      return
    }

    setIsSavingProfile(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: editedFirstName.trim(),
          lastName: editedLastName.trim() || null,
          citizenship: editedRegion.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const data = await response.json()
      if (data.success && data.user) {
        setProfileData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          citizenship: data.user.citizenship,
        })
        setIsEditingProfile(false)

        await updateSession()

        showToast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: 'success',
        })
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      showToast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'error',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/settings')
    }
  }, [status, router])

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

  const user = session.user
  const userEmail = user.email || ''

  const fullName = profileData
    ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
    : (user.name || 'User')
  const region = profileData?.citizenship || 'EU / UK / UAE'

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
            <p className="mt-1 max-w-lg text-sm text-text-secondary">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 shadow-card">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <div className="text-xs">
                <span className="font-medium text-text-main">{t('educationAccountOnly.title')}</span>
                <span className="ml-1 text-text-muted">{t('educationAccountOnly.subtitle')}</span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-text-muted transition hover:text-brand-600"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('viewDashboardOverview')}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile */}
            <section className="rounded-xl border border-surface-200 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-200 bg-surface-50">
                    <User className="h-4 w-4 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-main">{t('profile.title')}</h2>
                    <p className="text-xs text-text-muted">{t('profile.subtitle')}</p>
                  </div>
                </div>
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={handleEditProfile}
                    disabled={isLoadingProfile}
                    className="btn-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
                  >
                    {t('profile.editButton')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSavingProfile}
                      className="btn-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <X className="h-3 w-3" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="btn-primary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <Save className="h-3 w-3" />
                      <span>{isSavingProfile ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                    {isEditingProfile ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="font-medium text-text-muted">{t('profile.fields.fullName')} (First)</label>
                          <input
                            type="text"
                            value={editedFirstName}
                            onChange={(e) => setEditedFirstName(e.target.value)}
                            className="input-field w-full rounded-lg px-3 py-2 text-sm"
                            placeholder="First name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-medium text-text-muted">{t('profile.fields.fullName')} (Last)</label>
                          <input
                            type="text"
                            value={editedLastName}
                            onChange={(e) => setEditedLastName(e.target.value)}
                            className="input-field w-full rounded-lg px-3 py-2 text-sm"
                            placeholder="Last name (optional)"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-medium text-text-muted">{t('profile.fields.region')}</label>
                          <input
                            type="text"
                            value={editedRegion}
                            onChange={(e) => setEditedRegion(e.target.value)}
                            className="input-field w-full rounded-lg px-3 py-2 text-sm"
                            placeholder="Region (optional)"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <p className="text-text-muted">{t('profile.fields.fullName')}</p>
                          <p className="text-sm text-text-main">{fullName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-text-muted">{t('profile.fields.email')}</p>
                          <p className="flex items-center gap-1 text-sm text-text-main">
                            <Mail className="h-3.5 w-3.5 text-text-muted" />
                            {userEmail}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-text-muted">{t('profile.fields.region')}</p>
                          <p className="flex items-center gap-1 text-sm text-text-main">
                            <Globe2 className="h-3.5 w-3.5 text-text-muted" />
                            {region || 'Not set'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Preferences */}
            <section className="rounded-xl border border-surface-200 bg-white shadow-card">
              <div className="flex items-center gap-3 border-b border-surface-100 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-200 bg-surface-50">
                  <Languages className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-main">{t('preferences.title')}</h2>
                  <p className="text-xs text-text-muted">{t('preferences.subtitle')}</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2 text-xs">
                    <p className="font-medium text-text-main">{t('preferences.courseLanguage.label')}</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCourseLanguage('english')}
                        className={`rounded-lg border px-3 py-1.5 font-medium transition ${
                          courseLanguage === 'english'
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-surface-200 bg-surface-50 text-text-main hover:border-surface-300'
                        }`}
                      >
                        {t('preferences.courseLanguage.englishOnly')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseLanguage('both')}
                        className={`rounded-lg border px-3 py-1.5 font-medium transition ${
                          courseLanguage === 'both'
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-surface-200 bg-surface-50 text-text-main hover:border-surface-300'
                        }`}
                      >
                        {t('preferences.courseLanguage.both')}
                      </button>
                    </div>
                    <p className="text-text-muted">{t('preferences.courseLanguage.note')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-surface-100 pt-4 sm:grid-cols-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-text-main">{t('preferences.currency.label')}</p>
                    <p className="text-text-secondary">
                      {t('preferences.currency.description', {
                        currencies: Object.keys(currencies).join(', ')
                      })}
                    </p>
                    <p className="text-text-muted">{t('preferences.currency.note')}</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-text-main">{t('preferences.educationalFocus.label')}</p>
                    <p className="text-text-secondary">{t('preferences.educationalFocus.description')}</p>
                    <p className="text-text-muted">{t('preferences.educationalFocus.note')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="rounded-xl border border-surface-200 bg-white shadow-card">
              <div className="flex items-center gap-3 border-b border-surface-100 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-200 bg-surface-50">
                  <Bell className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-main">{t('notifications.title')}</h2>
                  <p className="text-[11px] text-text-muted">{t('notifications.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <Toggle
                  label={t('notifications.productUpdates.label')}
                  description={t('notifications.productUpdates.description')}
                  defaultOn={true}
                />
                <Toggle
                  label={t('notifications.aiStrategyIdeas.label')}
                  description={t('notifications.aiStrategyIdeas.description')}
                />
                <Toggle
                  label={t('notifications.billingReceipts.label')}
                  description={t('notifications.billingReceipts.description')}
                  defaultOn={true}
                  required={true}
                />
                <Toggle
                  label={t('notifications.accountAlerts.label')}
                  description={t('notifications.accountAlerts.description')}
                  defaultOn={true}
                  required={true}
                />
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Security */}
            <section className="rounded-xl border border-surface-200 bg-white shadow-card">
              <div className="flex items-center gap-2 border-b border-surface-100 px-5 py-4">
                <Lock className="h-4 w-4 text-brand-600" />
                <h2 className="text-xs font-semibold text-text-main">{t('security.title')}</h2>
              </div>

              <div className="p-5 space-y-4 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-main">{t('security.password.label')}</p>
                    <p className="text-text-muted">{t('security.password.lastUpdated')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="btn-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px]"
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>{t('security.password.resetButton')}</span>
                  </button>
                </div>
                <div className="border-t border-surface-100 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-text-main">{t('security.twoFactor.label')}</p>
                      <p className="text-text-muted">{t('security.twoFactor.status')}</p>
                    </div>
                    <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[10px] text-text-muted">
                      {t('security.twoFactor.comingSoon')}
                    </span>
                  </div>
                  <p className="mt-2 text-text-muted">{t('security.twoFactor.note')}</p>
                </div>
              </div>
            </section>

            {/* Data & privacy */}
            <section className="rounded-xl border border-surface-200 bg-white shadow-card">
              <div className="flex items-center gap-2 border-b border-surface-100 px-5 py-4">
                <Info className="h-4 w-4 text-brand-600" />
                <h2 className="text-xs font-semibold text-text-main">{t('dataPrivacy.title')}</h2>
              </div>

              <div className="p-5 space-y-3 text-[11px]">
                <p className="text-text-secondary">{t('dataPrivacy.description')}</p>
                <div className="space-y-2">
                  <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 text-left transition hover:border-surface-300">
                    <Download className="h-4 w-4 shrink-0 text-text-main" />
                    <div>
                      <p className="text-[11px] font-medium text-text-main">{t('dataPrivacy.export.label')}</p>
                      <p className="text-[11px] text-text-muted\">{t('dataPrivacy.export.description')}</p>
                    </div>
                  </button>
                  <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3 text-left transition hover:border-rose-300">
                    <Trash2 className="h-4 w-4 shrink-0 text-rose-500" />
                    <div>
                      <p className="text-[11px] font-medium text-rose-600">{t('dataPrivacy.delete.label')}</p>
                      <p className="text-[11px] text-text-muted">{t('dataPrivacy.delete.description')}</p>
                    </div>
                  </button>
                </div>
                <p className="text-text-muted">{t('dataPrivacy.note')}</p>
              </div>
            </section>
          </div>
        </div>

        {/* Danger note */}
        <div className="mt-6 flex items-start gap-4 rounded-xl border border-gold-200 bg-gold-50 p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-300 bg-white">
            <AlertTriangle className="h-4 w-4 text-gold-600" />
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-text-main">{t('dangerNote.title')}</h3>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="leading-relaxed text-text-secondary">{t('dangerNote.description')}</p>
            <p className="text-text-muted">{t('dangerNote.warning')}</p>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  )
}
