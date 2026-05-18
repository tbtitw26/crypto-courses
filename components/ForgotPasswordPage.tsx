'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true)
    setIsSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsSuccess(true)
        showToast({
          title: t('success'),
          variant: 'success',
        })
      } else {
        showToast({
          title: result.error || t('errors.generic'),
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Failed to submit forgot password form:', error)
      showToast({
        title: t('errors.generic'),
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — context panel */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between bg-surface-900 px-10 py-12 xl:px-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-700 bg-surface-800">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Avenqor</p>
              <p className="text-[11px] uppercase tracking-widest text-surface-500">Account Recovery</p>
            </div>
          </Link>

          <div className="mt-16 max-w-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-surface-700 bg-surface-800">
              <KeyRound className="h-7 w-7 text-brand-400" />
            </div>
            <h2 className="font-heading text-2xl font-semibold text-white">
              Secure account recovery
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-surface-400">
              We take your account security seriously. If an account exists with the email you provide, we will send password reset instructions.
            </p>
          </div>

          <div className="mt-12 space-y-4 rounded-xl border border-surface-700 bg-surface-800/50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <div>
                <p className="text-xs font-semibold text-surface-200">Security notice</p>
                <p className="mt-1 text-xs leading-relaxed text-surface-400">
                  For your protection, we do not confirm whether an email address is registered. You will receive instructions only if a matching account exists.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-surface-600">
          Education-only platform. We do not provide financial advice, manage accounts, or execute trades on your behalf.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-12 sm:px-12 lg:min-h-0 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
              </div>
              <span className="text-sm font-semibold text-text-main">Avenqor</span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('backToSignIn')}
            </Link>
          </div>

          {/* Desktop back link */}
          <Link
            href="/login"
            className="mb-8 hidden items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-main lg:inline-flex"
          >
            <ArrowLeft className="h-3 w-3" />
            {t('backToSignIn')}
          </Link>

          <div className="mb-8">
            <h1 className="font-heading text-2xl font-semibold text-text-main sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">{t('subtitle')}</p>
          </div>

          {isSuccess ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Instructions sent</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-700">{t('success')}</p>
                </div>
              </div>

              <Link
                href="/login"
                className="btn-primary block w-full text-center"
              >
                {t('backToSignIn')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-main">
                  {t('email')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className="h-4 w-4 text-surface-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={`input-field w-full pl-11 ${
                      errors.email ? 'border-rose-400 focus:ring-rose-400' : ''
                    }`}
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? 'Sending...' : t('submit')}
              </button>
            </form>
          )}

          <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-xs leading-relaxed text-text-muted">{t('note')}</p>
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
