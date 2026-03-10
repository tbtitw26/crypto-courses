// components/SettingsPage.tsx - Settings page component for dashboard

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { HomeSection } from './HomeSection'
import { DashboardNavigation } from './DashboardNavigation'
import { ChangePasswordModal } from './ChangePasswordModal'
import { currencies } from '@/lib/currency-config'
import { useToast } from '@/hooks/use-toast'
import { X, Save } from 'lucide-react'

const LOCALE_COOKIE_NAME = 'user_locale'

function getLocaleFromCookie(): 'en' | 'ar' {
  if (typeof window === 'undefined') return 'en'

  const cookies = document.cookie.split(';')
  const localeCookie = cookies.find((c) => c.trim().startsWith(`${LOCALE_COOKIE_NAME}=`))
  
  if (localeCookie) {
    const locale = localeCookie.split('=')[1]?.trim()
    if (locale === 'en' || locale === 'ar') {
      return locale
    }
  }
  
  return 'en'
}

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
        className={`mt-0.5 inline-flex h-5 w-9 rounded-full border px-0.5 transition-colors ${
          isOn
            ? 'border-cyan-400 bg-cyan-400/20 justify-end'
            : 'border-slate-600 bg-slate-900 justify-start'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full transition-colors ${
            isOn ? 'bg-cyan-400' : 'bg-slate-600'
          }`}
        />
      </button>
      <div className="text-[11px] text-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{label}</span>
          {required && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
              Required
            </span>
          )}
        </div>
        {description && (
          <p className="text-slate-400 mt-0.5">{description}</p>
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
  const [dashboardLanguage, setDashboardLanguage] = useState<'en' | 'ar'>('en')
  const [courseLanguage, setCourseLanguage] = useState('english')
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  
  // Profile editing state
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

  useEffect(() => {
    setDashboardLanguage(getLocaleFromCookie())
  }, [])

  // Load profile data when component mounts or session is available
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
        
        // Update session
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/settings')
    }
  }, [status, router])

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

  const user = session.user
  const userEmail = user.email || ''
  
  // Use profile data if available, otherwise fallback to session data
  const fullName = profileData
    ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
    : (user.name || 'User')
  const region = profileData?.citizenship || 'EU / UK / UAE'


  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 -z-10 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.26),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <main className="pt-6">
        {/* Dashboard Navigation */}
        <DashboardNavigation />

        {/* Top bar */}
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
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-200 font-medium">
                  {t('educationAccountOnly.title')}
                </span>
                <span className="text-slate-500">
                  {t('educationAccountOnly.subtitle')}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t('viewDashboardOverview')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </HomeSection>

        {/* Main grid */}
        <HomeSection className="pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Profile */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 sm:p-5 space-y-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                    <User className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-50">
                      {t('profile.title')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t('profile.subtitle')}
                    </div>
                  </div>
                </div>
                {!isEditingProfile ? (
                  <button
                    onClick={handleEditProfile}
                    disabled={isLoadingProfile}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-700 text-[11px] text-slate-100 hover:border-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{t('profile.editButton')}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-700 text-[11px] text-slate-100 hover:border-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-400/20 border border-cyan-400/50 text-[11px] text-cyan-300 hover:bg-cyan-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-3 h-3" />
                      <span>{isSavingProfile ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isLoadingProfile ? (
                <div className="text-[11px] text-slate-400 py-4">Loading profile data...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                  {isEditingProfile ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-slate-400">{t('profile.fields.fullName')} (First)</label>
                        <input
                          type="text"
                          value={editedFirstName}
                          onChange={(e) => setEditedFirstName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-[11px] focus:outline-none focus:border-cyan-400/50"
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400">{t('profile.fields.fullName')} (Last)</label>
                        <input
                          type="text"
                          value={editedLastName}
                          onChange={(e) => setEditedLastName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-[11px] focus:outline-none focus:border-cyan-400/50"
                          placeholder="Last name (optional)"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400">{t('profile.fields.region')}</label>
                        <input
                          type="text"
                          value={editedRegion}
                          onChange={(e) => setEditedRegion(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-[11px] focus:outline-none focus:border-cyan-400/50"
                          placeholder="Region (optional)"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="text-slate-400">{t('profile.fields.fullName')}</div>
                        <div className="text-slate-100">{fullName}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-400">{t('profile.fields.email')}</div>
                        <div className="inline-flex items-center gap-1 text-slate-100">
                          <Mail className="w-3 h-3" />
                          <span>{userEmail}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-400">{t('profile.fields.region')}</div>
                        <div className="inline-flex items-center gap-1 text-slate-100">
                          <Globe2 className="w-3 h-3" />
                          <span>{region || 'Not set'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>

            {/* Preferences */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 sm:p-5 space-y-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                    <Languages className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-50">
                      {t('preferences.title')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t('preferences.subtitle')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                <div className="space-y-2">
                  <div className="text-slate-400">{t('preferences.dashboardLanguage.label')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        if (dashboardLanguage === 'en') return
                        document.cookie = `${LOCALE_COOKIE_NAME}=en; path=/; max-age=31536000`
                        window.location.reload()
                      }}
                      className={`px-2.5 py-1 rounded-full font-medium transition ${
                        dashboardLanguage === 'en'
                          ? 'bg-slate-100 text-slate-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => {
                        if (dashboardLanguage === 'ar') return
                        document.cookie = `${LOCALE_COOKIE_NAME}=ar; path=/; max-age=31536000`
                        window.location.reload()
                      }}
                      className={`px-2.5 py-1 rounded-full font-medium transition ${
                        dashboardLanguage === 'ar'
                          ? 'bg-slate-100 text-slate-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      AR
                    </button>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {t('preferences.dashboardLanguage.note')}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-slate-400">{t('preferences.courseLanguage.label')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCourseLanguage('english')}
                      className={`px-2.5 py-1 rounded-full font-medium transition ${
                        courseLanguage === 'english'
                          ? 'bg-slate-100 text-slate-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {t('preferences.courseLanguage.englishOnly')}
                    </button>
                    <button
                      onClick={() => setCourseLanguage('both')}
                      className={`px-2.5 py-1 rounded-full font-medium transition ${
                        courseLanguage === 'both'
                          ? 'bg-slate-100 text-slate-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {t('preferences.courseLanguage.both')}
                    </button>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {t('preferences.courseLanguage.note')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] pt-2 border-t border-slate-900 mt-1">
                <div className="space-y-1">
                  <div className="text-slate-400">{t('preferences.currency.label')}</div>
                  <p className="text-slate-300">
                    {t('preferences.currency.description', { 
                      currencies: Object.keys(currencies).join(', ').replace('SR', 'SR (Saudi Riyal)')
                    })}
                  </p>
                  <p className="text-slate-500">
                    {t('preferences.currency.note')}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400">{t('preferences.educationalFocus.label')}</div>
                  <p className="text-slate-300">
                    {t('preferences.educationalFocus.description')}
                  </p>
                  <p className="text-slate-500">
                    {t('preferences.educationalFocus.note')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 sm:p-5 space-y-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                  <Bell className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-50">
                    {t('notifications.title')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t('notifications.subtitle')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </motion.div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-5">
            {/* Security */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 space-y-3 text-[11px] text-slate-300/90"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('security.title')}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-slate-200">{t('security.password.label')}</div>
                  <div className="text-slate-500">
                    {t('security.password.lastUpdated')}
                  </div>
                </div>
                <button
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-700 text-[11px] text-slate-100 hover:border-slate-500 transition"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>{t('security.password.resetButton')}</span>
                </button>
              </div>
              <div className="pt-2 border-t border-slate-900 mt-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-slate-200">{t('security.twoFactor.label')}</div>
                    <div className="text-slate-500">
                      {t('security.twoFactor.status')}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-400">
                    {t('security.twoFactor.comingSoon')}
                  </span>
                </div>
                <p className="text-slate-500">
                  {t('security.twoFactor.note')}
                </p>
              </div>
            </motion.div>

            {/* Data & privacy */}
            <motion.div
              className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 space-y-3 text-[11px] text-slate-300/90"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.18 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-3.5 h-3.5 text-cyan-300" />
                <div className="text-xs font-semibold text-slate-100">
                  {t('dataPrivacy.title')}
                </div>
              </div>
              <p>{t('dataPrivacy.description')}</p>
              <div className="flex flex-col gap-2 mt-1">
                <button className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-slate-700 transition">
                  <div className="flex items-center gap-2">
                    <Download className="w-3 h-3 text-slate-200" />
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] text-slate-100">
                        {t('dataPrivacy.export.label')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {t('dataPrivacy.export.description')}
                      </span>
                    </div>
                  </div>
                </button>
                <button className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-rose-500/70 transition">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3 h-3 text-rose-300" />
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] text-rose-100">
                        {t('dataPrivacy.delete.label')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {t('dataPrivacy.delete.description')}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-slate-500 mt-1">
                {t('dataPrivacy.note')}
              </p>
            </motion.div>
          </div>
        </HomeSection>

        {/* Danger note */}
        <HomeSection className="pb-10">
          <motion.div
            className="bg-slate-950/90 border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center border border-amber-400/70">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>
            <div className="space-y-2 text-[11px] text-slate-300/90">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-slate-100">
                  {t('dangerNote.title')}
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <p>{t('dangerNote.description')}</p>
              <p className="text-slate-400">{t('dangerNote.warning')}</p>
            </div>
          </motion.div>
        </HomeSection>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  )
}

