'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    consent: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak'
  if (password.length < 12) return 'medium'

  let strength = 0
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

const strengthConfig = {
  weak: { label: 'Weak', color: 'bg-rose-500', bars: 1 },
  medium: { label: 'Fair', color: 'bg-amber-500', bars: 2 },
  strong: { label: 'Strong', color: 'bg-emerald-500', bars: 3 },
} as const

export function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const [state, setState] = useState<'form' | 'success' | 'error'>('form')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setState('error')
      setErrorMessage(t('errors.tokenRequired'))
    }
  }, [token, t])

  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password))
    } else {
      setPasswordStrength('weak')
    }
  }, [password])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      consent: false,
    },
  })

  const watchedPassword = watch('password')
  useEffect(() => {
    setPassword(watchedPassword || '')
  }, [watchedPassword])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setState('error')
      setErrorMessage(t('errors.tokenRequired'))
      return
    }

    setIsSubmitting(true)
    setState('form')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
          consent: data.consent,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setState('success')
        showToast({
          title: t('states.success.title'),
          description: t('states.success.message'),
          variant: 'success',
        })
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setState('error')
        setErrorMessage(result.error || t('errors.generic'))
        showToast({
          title: t('states.error.title'),
          description: result.error || t('states.error.message'),
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      setState('error')
      setErrorMessage(t('errors.generic'))
      showToast({
        title: t('states.error.title'),
        description: t('errors.generic'),
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const cfg = strengthConfig[passwordStrength]

  if (state === 'success') {
    return (
      <div className="min-h-screen lg:grid lg:grid-cols-2">
        <SidePanel />
        <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 sm:px-12 lg:min-h-0 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[400px]">
            <MobileBrand />
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                <div>
                  <h2 className="font-heading text-lg font-semibold text-emerald-800">
                    {t('states.success.title')}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-700">
                    {t('states.success.message')}
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="btn-primary mt-6 block w-full text-center"
              >
                {t('backToSignIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen lg:grid lg:grid-cols-2">
        <SidePanel />
        <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 sm:px-12 lg:min-h-0 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[400px]">
            <MobileBrand />
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-gold-600" />
                <div>
                  <h2 className="font-heading text-lg font-semibold text-gold-800">
                    {t('states.error.title')}
                  </h2>
                  <p className="mt-1 text-sm text-gold-700">
                    {errorMessage || t('states.error.message')}
                  </p>
                </div>
              </div>
              <Link
                href="/forgot-password"
                className="btn-primary mt-6 block w-full text-center"
              >
                Request new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <SidePanel />

      {/* Right — form */}
      <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 sm:px-12 lg:min-h-0 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[400px]">
          <MobileBrand />

          <Link
            href="/login"
            className="mb-8 hidden items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-main lg:inline-flex"
          >
            <ArrowLeft className="h-3 w-3" />
            {t('backToSignIn')}
          </Link>

          <div className="mb-2">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-medium text-text-main">
              <Lock className="h-3 w-3 text-brand-600" />
              {t('badge')}
            </div>
            <h1 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">{t('subtitle')}</p>
          </div>

          <div className="mb-6 space-y-2 text-xs text-text-muted">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <span>{t('securityInfo.linkValid')}</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
              <span>{t('securityInfo.didNotRequest')}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {t('stepIndicator')}
                </span>
                <span className="text-text-muted">{t('stepNote')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1 w-6 rounded-full bg-surface-300" />
                <span className="h-1 w-6 rounded-full bg-brand-600" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-main">
                {t('newPassword')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder={t('newPasswordPlaceholder')}
                  className={`input-field w-full pl-11 ${
                    errors.password ? 'border-rose-400 focus:ring-rose-400' : ''
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>
              )}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((bar) => (
                      <span
                        key={bar}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          bar <= cfg.bars ? cfg.color : 'bg-surface-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">
                    {t('passwordStrength')}:{' '}
                    <span className={
                      passwordStrength === 'weak'
                        ? 'text-rose-600'
                        : passwordStrength === 'medium'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }>
                      {passwordStrength === 'weak'
                        ? t('passwordStrengthWeak')
                        : passwordStrength === 'medium'
                        ? t('passwordStrengthMedium')
                        : t('passwordStrengthStrong')}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-text-main">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder={t('confirmPasswordPlaceholder')}
                  className={`input-field w-full pl-11 ${
                    errors.confirmPassword ? 'border-rose-400 focus:ring-rose-400' : ''
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.confirmPassword.message}</p>
              )}
              <p className="mt-1.5 text-xs text-text-muted">{t('securityNote')}</p>
            </div>

            <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="consent"
                  {...register('consent')}
                  className="mt-0.5 h-4 w-4 rounded border-surface-300 bg-white accent-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm leading-relaxed text-text-secondary">{t('consent')}</span>
              </label>
              {errors.consent && (
                <p className="mt-2 text-xs text-rose-600">{errors.consent.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>{isSubmitting ? 'Resetting...' : t('submit')}</span>
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-xs leading-relaxed text-text-muted">{t('helperNote')}</p>
          </div>

          {/* Mobile trust strip */}
          <div className="mt-8 border-t border-surface-200 pt-6 lg:hidden">
            <p className="text-center text-xs leading-relaxed text-text-muted">
              Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SidePanel() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:justify-between bg-surface-900 px-10 py-12 xl:px-16">
      <div>
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-700 bg-surface-800">
            <ShieldCheck className="h-4.5 w-4.5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Cur Nova</p>
            <p className="text-[11px] uppercase tracking-widest text-surface-500">Credential Reset</p>
          </div>
        </Link>

        <div className="mt-16 max-w-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
            <KeyRound className="h-7 w-7 text-brand-400" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-white">
            Set your new password
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-surface-400">
            Choose a strong password to keep your account secure. Your new credentials will take effect immediately.
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-surface-600">
        Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
      </p>
    </div>
  )
}

function MobileBrand() {
  const t = useTranslations('auth.resetPassword')
  return (
    <div className="mb-8 flex items-center justify-between lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
        </div>
        <span className="text-sm font-semibold text-text-main">Cur Nova</span>
      </div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-3 w-3" />
        {t('backToSignIn')}
      </Link>
    </div>
  )
}
